import { Pool } from "mysql2/promise";
import { Transactional } from "../decorators";
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

    it("모두 다 저장 성공", async () => {
        await orchestrator.saveOneRecordForEach();
        await expect(orchestrator.countAll()).resolves.toBe(5);
    });

    it(`0.5 의 확률으로 단일 저장소에서 저장 실패 - 저장 실패하면 모두 저장되면 안됨`, async () => {
        const FAIL_RATE = 0.5;
        try {
            await orchestrator.saveOneRecordForEach(FAIL_RATE);
        } catch (e) { }

        const count = await orchestrator.countAll();
        expect(count).toBe(5);
    });

    it("clean up", async () => {
        try {
            await orchestrator.dropAll();
            await orchestrator.destroy();
        } catch (e) {
            console.log(e)
        }
    });
});

describe("중첩된 @Transactional 환경에서의 동작", () => {
    let orchestrator1: Orchestrator;
    let orchestrator2: Orchestrator;
    let mainOrchestrator: MultiDBOrchestrator;

    const DB_1 = "test_db_1";
    const DB_2 = "test_db_2";
    const MAIN_DB = "test_main_db";

    beforeAll(async () => {
        const mainOrchestratorFactory = await MultiDBOrchestrator.setUp(
            MAIN_DB,
            new Set(["sentinel_first", "sentinel_second"])
        );
        const orchestratorFactory1 = await Orchestrator.setUp(
            DB_1,
            new Set(["first", "second"])
        );
        const orchestratorFactory2 = await Orchestrator.setUp(
            DB_2,
            new Set(["third", "forth"])
        );

        
        let mainPool = createUnitOfWorkPool({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: MAIN_DB,

            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0,

            connectTimeout: 60000,

            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
        });

        let pool1 = createUnitOfWorkPool({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: DB_1,

            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0,

            connectTimeout: 60000,

            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
        });

        let pool2 = createUnitOfWorkPool({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: DB_2,

            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0,

            connectTimeout: 60000,

            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
        });

        orchestrator1 = orchestratorFactory1(pool1);
        orchestrator2 = orchestratorFactory2(pool2);
        mainOrchestrator = mainOrchestratorFactory(mainPool, orchestrator1, orchestrator2);
    });

    it("중첩된 operation 모두 성공 시 모두 저장 완료", async () => {
        await mainOrchestrator.saveMultipleRecords();

        const [mainCount, count1, count2] = await mainOrchestrator.verifyResults();
        expect(mainCount).toBe(2);
        expect(count1).toBe(2);
        expect(count2).toBe(2);
    }, 1000000);

    it("clean up", async () => {
        try {
            await orchestrator1.dropAll();
            // await orchestrator1.destroy();

            await orchestrator2.dropAll();
            // await orchestrator2.destroy();

            await mainOrchestrator.dropAll();
            // await mainOrchestrator.destroy();
        } catch (e) {
            console.log(e);
        }
    });

    it("중첩된 @Transaction 중 실패한 작업 뒤에 일어나는 모든 작업은 Rollback 되어야 함", async () => {
        const ORCH_1_FAIL_RATE = 0;
        const MAIN_FAIL_RATE = 1;
        const ORCH_2_FAIL_RATE = 0;
        
        await expect(mainOrchestrator.saveMultipleRecords(
            MAIN_FAIL_RATE,
            ORCH_1_FAIL_RATE,
            ORCH_2_FAIL_RATE
        )).rejects.toThrow(Error);

        const [mainCount, orch1Count, orch2Count] = await mainOrchestrator.verifyResults();
        expect(orch1Count).toBe(2);
        expect(mainCount).toBe(0);
        expect(orch2Count).toBe(0);
    });

    it("clean up", async () => {
        try {
            await orchestrator1.dropAll();
            await orchestrator1.destroy();

            await orchestrator2.dropAll();
            await orchestrator2.destroy();

            await mainOrchestrator.dropAll();
            await mainOrchestrator.destroy();
        } catch (e) {
            console.log(e);
        }
    });
});


class Orchestrator {
    constructor(
        protected readonly pool: Pool,
        protected readonly repositories: Record<string, Repository<PersistanceObject>>
    ) { };

    protected static async makeDatabase(name: string): Promise<void> {
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
    ): Promise<(pool: Pool, ...extraArgs: any[]) => Orchestrator> {
        await Orchestrator.makeDatabase(databaseName);

        let repos: Record<string, Repository<PersistanceObject>> = {};
        for (const tableName of tableNames.values()) {
            repos[tableName] = await Repository.makeTable(tableName, databaseName)
        }

        return (pool: Pool) => {
            return new Orchestrator(pool, repos);
        }
    }

    @Transactional(MySQLUnitOfWork, async (error?: Error) => {
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
            repo.drop(this.pool);
        }

        await new Promise((resolve, reject) => setTimeout(resolve, 1500));
    }

    async destroy(): Promise<void> {
        await this.pool.end();
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
        const conn = await pool.getConnection();
        try {
            await conn.execute(`delete from ${this.TableName}`)
        } catch (e) {
            console.error('Error:', e);
            throw e;
        } finally {
            conn.release();
        }
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
class MultiDBOrchestrator extends Orchestrator {
    constructor(
        pool: Pool,
        repositories: Record<string, Repository<PersistanceObject>>,
        private readonly orchestrator1: Orchestrator,
        private readonly orchestrator2: Orchestrator
    ) {
        super(pool, repositories);
    }

    static async setUp(
        databaseName: string,
        tableNames: Set<string>
    ): Promise<(
        pool: Pool,
        orchestrator1: Orchestrator, 
        orchestrator2: Orchestrator
    ) => MultiDBOrchestrator> {
        await Orchestrator.makeDatabase(databaseName);

        let repos: Record<string, Repository<PersistanceObject>> = {};
        for (const tableName of tableNames.values()) {
            repos[tableName] = await Repository.makeTable(tableName, databaseName)
        }

        return (pool: Pool, orchestrator1: Orchestrator, orchestrator2: Orchestrator,) => {
            return new MultiDBOrchestrator(pool, repos, orchestrator1, orchestrator2);
        }
    }

    @Transactional(MySQLUnitOfWork, async (error?: Error) => {
        if (!error) return;
        console.error(error);
    })
    async saveMultipleRecords(
        mainFailRate: number = 0,
        orch1FailRate: number = 0,
        orch2FailRate: number = 0
    ) {
        await this.orchestrator1.saveOneRecordForEach(orch1FailRate);
        for (const repo of Object.values(this.repositories)) {
            await repo.append(this.pool, "sample", mainFailRate);
        }
        await this.orchestrator2.saveOneRecordForEach(orch2FailRate);
    }

    async verifyResults(): Promise<[mainCount: number, orch1Count: number, orch2Count: number]> {
        const mainCount = await this.countAll();
        const count1 = await this.orchestrator1.countAll();
        const count2 = await this.orchestrator2.countAll();
        return [mainCount, count1, count2];
    }
}