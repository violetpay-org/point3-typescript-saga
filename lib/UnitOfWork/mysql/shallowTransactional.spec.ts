import { Pool } from "mysql2/promise";
import { ShallowTransactional, Transactional } from "../decorators";
import { MySQLUnitOfWork } from "./unitOfWork";
import { createUnitOfWorkPool } from "./pool";

const MYSQL_USER = "root";
const MYSQL_HOST = "0.0.0.0";
const MYSQL_PASSWORD = "point3";
const MYSQL_DATABASE = "test_db";

describe("createTransactionalPool 과 MySQLUnitOfWork 를 활용한 @Transactional Test", () => {
    let orchestrator: Orchestrator;

    beforeAll(async () => {
        const orchestratorFactory = await Orchestrator.setUp(
            MYSQL_DATABASE,
            new Set([
                "first",
                "second",
                "thrid",
                "forth",
                "fifth"
            ])
        );

        let pool = createUnitOfWorkPool({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: MYSQL_DATABASE,
        
            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0,
        });

        orchestrator = orchestratorFactory(pool);
    });

    afterAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await orchestrator.dropAll();
        await orchestrator.destroy();
    });

    it("모두 다 저장 성공", async () => {
        await orchestrator.saveOneRecordForEach();
        await expect(orchestrator.countAll()).resolves.toBe(5);
    });
    
    it(`0.5 의 확률으로 단일 저장소에서 저장 실패 - 저장 실패하면 모두 저장되면 안됨`, async () => {
        const FAIL_RATE = 0.5;
        try {
            await orchestrator.saveOneRecordForEach(FAIL_RATE);
        } catch (e) {}
        
        await expect(orchestrator.countAll()).resolves.toBe(5);
    });
});

class Orchestrator {
    constructor(
        private readonly pool: Pool,
        private readonly repositories: Record<string, Repository<PersistanceObject>>
    ) { };

    private static async makeDatabase(name: string): Promise<void> {
        const { spawn } = require('child_process');
        return new Promise((resolve, reject) => {
            const mysql = spawn(
                'mysql',
                [
                    '-u',
                    MYSQL_USER,
                    '-h',
                    MYSQL_HOST,
                    `-p${MYSQL_PASSWORD}`,
                    "--protocol=tcp"
                ]
            );

            mysql.stdin.write(
                `create database if not exists ${name};`
            );
            mysql.stdin.end();

            mysql.stderr.on("data", (data) => {
                const stringified: string = Buffer.from(data).toString();
                console.log(stringified)
                if (stringified.includes("[Warning]")) return;
                reject(new Error("ERR: during creating database"));
            });
            mysql.on("close", (code) => {
                if (code == 0) resolve();
                reject(new Error("ERR: during creating database"));
            })
        });
    }

    static async setUp(
        databaseName: string,
        tableNames: Set<string>
    ): Promise<(pool: Pool) => Orchestrator> {
        await Orchestrator.makeDatabase(databaseName);

        let repos: Record<string, Repository<PersistanceObject>> = {};
        for (const tableName of tableNames.values()) {
            repos[tableName] = await Repository.makeTable(tableName, databaseName)
        }

        return (pool: Pool) => {
            return new Orchestrator(pool, repos);
        }
    }

    @ShallowTransactional(MySQLUnitOfWork, async (error?: Error) => {
        if (!error) return;
        console.error(error);
    })
    async saveOneRecordForEach(failRate?: number): Promise<void> {
        for (const repo of Object.values(this.repositories)) {
            await repo.append(this.pool, "sample", failRate);
        }
    }

    async countAll(): Promise<number> {
        let count = 0;
        for (const repo of Object.values(this.repositories)) {
            count += await repo.count(this.pool);
        }

        return count;
    }

    async dropAll(): Promise<void> {
        for (const repo of Object.values(this.repositories)) {
            await repo.drop(this.pool);
        }

        await this.pool.execute(`DROP DATABASE IF EXISTS ${MYSQL_DATABASE}`);
    }

    async destroy(): Promise<void> {
        await this.pool.end()
    }
}

class Repository<O extends PersistanceObject> {
    constructor(private object: O) { }

    static async makeTable(
        withName: string,
        at: string
    ): Promise<Repository<PersistanceObject>> {
        class NewPersistanceObject extends PersistanceObject {
            get TableName(): string {
                return withName;
            }
        }

        const object = new NewPersistanceObject;

        const { spawn } = require('child_process');
        const { name, tableContent } = object.Table;

        return new Promise((resolve, reject) => {
            const mysql = spawn(
                'mysql',
                [
                    '-u',
                    MYSQL_USER,
                    '-h',
                    MYSQL_HOST,
                    `-p${MYSQL_PASSWORD}`,
                    "--protocol=tcp"
                ]
            );
            mysql.stdin.write(`use ${at};`);
            mysql.stdin.write(
                `create table if not exists ${name} ${tableContent};`
            );
            mysql.stdin.end();

            mysql.stderr.on('data', (data) => {
                const stringified: string = Buffer.from(data).toString();
                if (stringified.includes("[Warning]")) return;
                reject(new Error(`MySQL Error: ${data}`));
            });

            mysql.on('close', (code) => {
                if (code === 0) {
                    resolve(new Repository(object));
                } else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    }

    get TableName(): string {
        return this.object.Table.name;
    }

    async count(pool: Pool): Promise<number> {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) FROM ${this.TableName}`
        );
        return Number(rows[0]['COUNT(*)']);
    }

    async drop(pool: Pool): Promise<void> {
        await pool.execute(`DROP TABLE IF EXISTS ${this.TableName}`);
    }

    async append(
        pool: Pool,
        ...values: [
            ...ReturnType<O["ValueArgGuide"]>, 
            failRate?: number
        ]
    ): Promise<void> {
        const conn = await pool.getConnection();
        
        const requiredArgCount = this.object.ValueArgGuide().length;
        let failRate = 0;
        let args = values.slice(0, requiredArgCount);
        
        if (values.length > requiredArgCount && typeof values[values.length - 1] === 'number') {
            failRate = values.pop() as number;
        }
        
        try {
            await conn.beginTransaction();

            await conn.execute(
                this.object.InsertSQL,
                args
            );
            
            /**
             * ```
             * 연속 균등 확률 변수 X를 정의:
             * X ~ Unif(0,1)
             * 
             * 실패 여부를 나타내는 베르누이 확률 변수 I:
             * I ~ Bern(p), p = failRate
             * 
             * I의 확률 질량 함수:
             * P(I = 1) = p = failRate
             * P(I = 0) = 1 - p = 1 - failRate
             * 
             * 이를 시뮬레이션하기 위해 X를 샘플링하고 다음과 같이 설정:
             * I = 1{X < failRate}
             * 
             * 여기서 1{·}는 지시 함수(indicator function)임.
             * ```
             */
            if (failRate > 0 && Math.random() < failRate) {
                throw new Error("Simulated failure for testing");
            }
            
            await conn.commit();
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    }
}

abstract class PersistanceObject {
    static get TableContent(): string {
        return `(
            id int not null auto_increment primary key,
            value varchar(255) not null,
            created_at datetime not null default (now(1))
            )`
    };
    protected abstract get TableName(): string;

    /**
     * TableContent에서 사용되는 커스텀 인풋에 대한 가이드입니다.
     * 
     * 이 메서드는 테이블에 데이터를 삽입할 때 필요한 값들의 타입을 정의합니다.
     * append() 메서드 호출 시 이 가이드에 맞는 인자들을 전달해야 합니다.
     * 
     * 사용 예시:
     * ```typescript
     * const repo = new Repository(new CustomObject());
     * await repo.append(pool, "테스트 값"); // value 컬럼에 "테스트 값" 삽입
     * ```
     */
    ValueArgGuide(): [value: string] {
        return ["string"];
    }

    get Table(): {
        name: string,
        tableContent: string
    } {
        return {
            name: this.TableName,
            tableContent: PersistanceObject.TableContent
        };
    }

    get InsertSQL(): string {
        return `INSERT INTO ${this.TableName} (value) VALUES (?)`
    }
}