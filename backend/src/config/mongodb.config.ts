import { registerAs } from '@nestjs/config';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo1:30001,mongo2:30002,mongo3:30003/my_database';

export default registerAs('mongodb', () => ({
    uri: MONGODB_URI,
}));