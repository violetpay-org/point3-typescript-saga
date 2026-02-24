"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const decorators_1 = require("../decorators");
const unitOfWork_1 = require("./unitOfWork");
const pool_1 = require("./pool");
const MYSQL_USER = "root";
const MYSQL_HOST = "0.0.0.0";
const MYSQL_PASSWORD = "point3";
const MYSQL_DATABASE = "test_db";
describe("createTransactionalPool 과 MySQLUnitOfWork 를 활용한 @Transactional Test", () => {
    let orchestrator;
    beforeAll(async () => {
        const orchestratorFactory = await Orchestrator.setUp(MYSQL_DATABASE, new Set([
            "first",
            "second",
            "thrid",
            "forth",
            "fifth"
        ]));
        let pool = (0, pool_1.createUnitOfWorkPool)({
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
        }
        catch (e) { }
        await expect(orchestrator.countAll()).resolves.toBe(5);
    });
});
class Orchestrator {
    constructor(pool, repositories) {
        this.pool = pool;
        this.repositories = repositories;
    }
    ;
    static async makeDatabase(name) {
        const { spawn } = require('child_process');
        return new Promise((resolve, reject) => {
            const mysql = spawn('mysql', [
                '-u',
                MYSQL_USER,
                '-h',
                MYSQL_HOST,
                `-p${MYSQL_PASSWORD}`,
                "--protocol=tcp"
            ]);
            mysql.stdin.write(`create database if not exists ${name};`);
            mysql.stdin.end();
            mysql.stderr.on("data", (data) => {
                const stringified = Buffer.from(data).toString();
                console.log(stringified);
                if (stringified.includes("[Warning]"))
                    return;
                reject(new Error("ERR: during creating database"));
            });
            mysql.on("close", (code) => {
                if (code == 0)
                    resolve();
                reject(new Error("ERR: during creating database"));
            });
        });
    }
    static async setUp(databaseName, tableNames) {
        await Orchestrator.makeDatabase(databaseName);
        let repos = {};
        for (const tableName of tableNames.values()) {
            repos[tableName] = await Repository.makeTable(tableName, databaseName);
        }
        return (pool) => {
            return new Orchestrator(pool, repos);
        };
    }
    async saveOneRecordForEach(failRate) {
        for (const repo of Object.values(this.repositories)) {
            await repo.append(this.pool, "sample", failRate);
        }
    }
    async countAll() {
        let count = 0;
        for (const repo of Object.values(this.repositories)) {
            count += await repo.count(this.pool);
        }
        return count;
    }
    async dropAll() {
        for (const repo of Object.values(this.repositories)) {
            await repo.drop(this.pool);
        }
        await this.pool.execute(`DROP DATABASE IF EXISTS ${MYSQL_DATABASE}`);
    }
    async destroy() {
        await this.pool.end();
    }
}
__decorate([
    (0, decorators_1.ShallowTransactional)(unitOfWork_1.MySQLUnitOfWork, async (error) => {
        if (!error)
            return;
        console.error(error);
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], Orchestrator.prototype, "saveOneRecordForEach", null);
class Repository {
    constructor(object) {
        this.object = object;
    }
    static async makeTable(withName, at) {
        class NewPersistanceObject extends PersistanceObject {
            get TableName() {
                return withName;
            }
        }
        const object = new NewPersistanceObject;
        const { spawn } = require('child_process');
        const { name, tableContent } = object.Table;
        return new Promise((resolve, reject) => {
            const mysql = spawn('mysql', [
                '-u',
                MYSQL_USER,
                '-h',
                MYSQL_HOST,
                `-p${MYSQL_PASSWORD}`,
                "--protocol=tcp"
            ]);
            mysql.stdin.write(`use ${at};`);
            mysql.stdin.write(`create table if not exists ${name} ${tableContent};`);
            mysql.stdin.end();
            mysql.stderr.on('data', (data) => {
                const stringified = Buffer.from(data).toString();
                if (stringified.includes("[Warning]"))
                    return;
                reject(new Error(`MySQL Error: ${data}`));
            });
            mysql.on('close', (code) => {
                if (code === 0) {
                    resolve(new Repository(object));
                }
                else {
                    reject(new Error(`Process exited with code ${code}`));
                }
            });
        });
    }
    get TableName() {
        return this.object.Table.name;
    }
    async count(pool) {
        const [rows] = await pool.execute(`SELECT COUNT(*) FROM ${this.TableName}`);
        return Number(rows[0]['COUNT(*)']);
    }
    async drop(pool) {
        await pool.execute(`DROP TABLE IF EXISTS ${this.TableName}`);
    }
    async append(pool, ...values) {
        const conn = await pool.getConnection();
        const requiredArgCount = this.object.ValueArgGuide().length;
        let failRate = 0;
        let args = values.slice(0, requiredArgCount);
        if (values.length > requiredArgCount && typeof values[values.length - 1] === 'number') {
            failRate = values.pop();
        }
        try {
            await conn.beginTransaction();
            await conn.execute(this.object.InsertSQL, args);
            if (failRate > 0 && Math.random() < failRate) {
                throw new Error("Simulated failure for testing");
            }
            await conn.commit();
        }
        catch (e) {
            await conn.rollback();
            throw e;
        }
        finally {
            conn.release();
        }
    }
}
class PersistanceObject {
    static get TableContent() {
        return `(
            id int not null auto_increment primary key,
            value varchar(255) not null,
            created_at datetime not null default (now(1))
            )`;
    }
    ;
    ValueArgGuide() {
        return ["string"];
    }
    get Table() {
        return {
            name: this.TableName,
            tableContent: PersistanceObject.TableContent
        };
    }
    get InsertSQL() {
        return `INSERT INTO ${this.TableName} (value) VALUES (?)`;
    }
}
//# sourceMappingURL=shallowTransactional.spec.js.map