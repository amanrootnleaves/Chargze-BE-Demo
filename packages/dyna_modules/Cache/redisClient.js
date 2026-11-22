import Redis from "ioredis";

const redisConfig = {
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

let redis

if (global.REDIS_CLIENT) {
  
  redis = global.REDIS_CLIENT;

} else {
  redis = new Redis(process.env.REDIS_URL || redisConfig);
  global.REDIS_CLIENT = redis;
}

export default redis;