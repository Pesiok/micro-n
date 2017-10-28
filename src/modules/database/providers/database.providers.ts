import { URL } from 'url';
import * as redis from 'redis';
import { createConnection, Connection } from 'typeorm';
import { promisifyAll } from '../../common/util/promisifyAll';
import { IdatabaseProviders } from './../interfaces/providers.interface';
import { IRedisClientPromisifed } from './../interfaces/database.interface';
import { MySQLConnectionToken, RedisClientToken } from '../../constants';
import { UserEntity } from '../../users/entities/user.entity';
import { PostEntity } from '../../posts/entities/post.entity';

let mysqlConnectionCounter = 0;

export const databaseProviders: IdatabaseProviders[] = [
  {
    provide: MySQLConnectionToken,
    useFactory: async () => {
      const mysqlConfig = new URL(process.env.MYSQL_URL);
      const connection: Connection = await createConnection({
        name: `connection-${mysqlConnectionCounter}`,
        type: 'mysql',
        host: mysqlConfig.hostname,
        port: Number.parseInt(mysqlConfig.port),
        username: mysqlConfig.username,
        password: mysqlConfig.password,
        database: mysqlConfig.pathname.substr(1),
        entities: [
          UserEntity,
          PostEntity,
        ],
        synchronize: true,
      });

      mysqlConnectionCounter++;
      return connection;
    },
  },
  {
    provide: RedisClientToken,
    useFactory: async () => {
      const db = process.env.REDIS_DATABASE;
      const url = process.env.REDIS_URL;
      let redisClient: IRedisClientPromisifed;

      // Promisify all methods!
      // before:
      //  redisClient[method](data, callback);
      // after:
      //  const info: Promise<T> = redisClient[methodAsync](data);
      promisifyAll(redis.RedisClient.prototype);
      promisifyAll(redis.Multi.prototype);

      if (url) {
        // production setup
        redisClient = redis.createClient(url);

      } else {
        // dev & test setup
        redisClient = redis.createClient();

        try {
          await redisClient.selectAsync(db);
        } catch (error) {
          console.log(`Couldn\' connect to the Redis DB from ${db} namespace`);
          console.log('details: ', error);
        }
      }

      return redisClient;
    },
  },
];
