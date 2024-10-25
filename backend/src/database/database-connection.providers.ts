import * as mongoose from 'mongoose';
import { DATABASE_CONNECTION } from './constants';
import mongodbConfig from 'config/mongodb.config';
import { ConfigType } from '@nestjs/config';

export const databaseProviders = [
    {
        provide: DATABASE_CONNECTION,
        useFactory: (dbConfig: ConfigType<typeof mongodbConfig>): mongoose.Connection => {
            const conn = mongoose.createConnection(dbConfig.uri, {
                serverSelectionTimeoutMS: 5000,
                autoIndex: false, // Don't build indexes
                maxPoolSize: 10, // Maintain up to 10 socket connections
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                family: 4, // Use IPv4, skip trying IPv6,
                replicaSet: "my-replica-set"
            });

            conn.on('connected', () => {
                console.log('Connected to MongoDB');
            });
            
            conn.on('error', (err) => {
                console.error('Error connecting to MongoDB:', err);
            });
            
            conn.on('disconnected', () => {
                console.log('Disconnected from MongoDB');
            });

            return conn;
        },
        inject: [mongodbConfig.KEY],
    },
];
