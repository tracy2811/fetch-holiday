"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const graphql_1 = require("graphql");
const ioredis_1 = __importDefault(require("ioredis"));
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const redis = new ioredis_1.default(REDIS_PORT, 'redis');
const API_KEY = process.env.API_KEY || '769410283bc951f189ec586b30214c972423116c';
const currentYear = new Date().getFullYear();
// Get holidays for specific country
const getHoliday = function (country, year) {
    // Get holidays from redis
    return redis.get(`fetch-holiday:${country}`).then(function (data) {
        if (data !== null) {
            return JSON.parse(data);
        }
        // Holidays for this country not exist, fetch from calendarific
        return axios_1.default.get('https://calendarific.com/api/v2/holidays', {
            params: {
                api_key: API_KEY,
                country: country,
                year
            }
        }).then(res => {
            const holidays = res.data.response.holidays;
            holidays.forEach(holiday => {
                holiday.date = holiday.date.iso;
            });
            // Set holidays for this country in redis
            redis.set(`fetch-holiday:${country}`, JSON.stringify(holidays)); // It is not good practice to use JSON.stringify
            return holidays;
        });
    }).catch(err => console.log(err));
};
// HolidayType
const HolidayType = new graphql_1.GraphQLObjectType({
    name: 'Holiday',
    description: 'Holiday information',
    fields: () => ({
        name: { type: graphql_1.GraphQLString },
        description: { type: graphql_1.GraphQLString },
        date: { type: graphql_1.GraphQLString },
        type: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
        state: { type: new graphql_1.GraphQLList(graphql_1.GraphQLString) },
    }),
});
// CountryType
const CountryType = new graphql_1.GraphQLObjectType({
    name: 'Country',
    description: 'Country and it\'s holidays information',
    fields: () => ({
        country_name: { type: graphql_1.GraphQLString },
        iso_3166: { type: graphql_1.GraphQLString },
        total_holidays: { type: graphql_1.GraphQLInt },
        holidays: { type: new graphql_1.GraphQLList(HolidayType) },
    }),
});
// Root Query
const Query = new graphql_1.GraphQLObjectType({
    name: 'Query',
    fields: {
        // Return all countries and their holidays
        countries: {
            type: new graphql_1.GraphQLList(CountryType),
            args: {
                year: { type: graphql_1.GraphQLInt },
            },
            resolve(parent, args) {
                return axios_1.default.get('https://calendarific.com/api/v2/countries', {
                    params: {
                        api_key: API_KEY,
                    }
                }).then(res => {
                    const countries = res.data.response.countries;
                    countries.forEach(country => {
                        const year = args.year || currentYear;
                        country.iso_3166 = country['iso-3166'];
                        const holidays = getHoliday(country.iso_3166, year);
                        country.holidays = holidays;
                    });
                    return countries;
                });
            },
        },
        // Return all holidays for specific country
        holidays: {
            type: new graphql_1.GraphQLList(HolidayType),
            args: {
                country: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
                year: { type: graphql_1.GraphQLInt },
            },
            resolve(parent, args) {
                const year = args.year || currentYear;
                return getHoliday(args.country, year);
            },
        },
    }
});
exports.default = new graphql_1.GraphQLSchema({
    query: Query,
});
