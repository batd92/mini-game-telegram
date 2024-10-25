import { Module } from '@nestjs/common';
import { databaseProviders } from './database-connection.providers';
import { databaseModelsProviders } from './database-models.providers';
import mongodbConfig from 'config/mongodb.config';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo1:27017,mongo2:27017,mongo3:27017/my_database_name?replicaSet=my-mongo-set';

@Module({
    imports: [
        ConfigModule.forFeature(mongodbConfig),
        MongooseModule.forRoot(MONGODB_URI),
    ],
    providers: [...databaseProviders, ...databaseModelsProviders],
    exports: [...databaseProviders, ...databaseModelsProviders],
})
export class DatabaseModule { }
