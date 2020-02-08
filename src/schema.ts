import axios from 'axios';
import {
	GraphQLSchema,
	GraphQLNonNull,
	GraphQLString,
	GraphQLObjectType,
	GraphQLInt,
	GraphQLList,
} from 'graphql';
import Redis from 'ioredis';
const REDIS_PORT: number = process.env.REDIS_PORT || 6379;
const redis = new Redis(REDIS_PORT, 'redis');
const API_KEY: string = process.env.API_KEY || '769410283bc951f189ec586b30214c972423116c';
const currentYear: number = new Date().getFullYear();

// Get holidays for specific country
const getHoliday = function (country, year) {
	// Get holidays from redis
	return redis.get(`fetch-holiday:${country}`).then(function (data) {
		if (data !== null) {
			return JSON.parse(data)
		}

		// Holidays for this country not exist, fetch from calendarific
		return axios.get('https://calendarific.com/api/v2/holidays', {
			params: {
				api_key: API_KEY,
				country: country,
				year
			}
		}).then(res => {
			const holidays = res.data.response.holidays
			holidays.forEach(holiday => {
				holiday.date = holiday.date.iso;
			});

			// Set holidays for this country in redis
			redis.set(`fetch-holiday:${country}`, JSON.stringify(holidays)); // It is not good practice to use JSON.stringify
			return holidays
		});
	}).catch(err => console.log(err));

}

// HolidayType
const HolidayType = new GraphQLObjectType({
	name: 'Holiday',
	description: 'Holiday information',
	fields: () => ({
		name: { type: GraphQLString },
		description: { type: GraphQLString },
		date: { type: GraphQLString },
		type: { type: new GraphQLList(GraphQLString) },
		state: { type: new GraphQLList(GraphQLString) },
	}),
});

// CountryType
const CountryType = new GraphQLObjectType({
	name: 'Country',
	description: 'Country and it\'s holidays information',
	fields: () => ({
		country_name: { type: GraphQLString },
		iso_3166: { type: GraphQLString },
		total_holidays: { type: GraphQLInt },
		holidays: { type: new GraphQLList(HolidayType) },
	}),
});

// Root Query
const Query = new GraphQLObjectType ({
	name: 'Query',
	fields: {

		// Return all countries and their holidays
		countries: {
			type: new GraphQLList(CountryType),
			args: {
				year: { type: GraphQLInt },
			},
			resolve(parent, args) {
				return axios.get('https://calendarific.com/api/v2/countries', {
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
			type: new GraphQLList(HolidayType),
			args: {
				country: { type: new GraphQLNonNull(GraphQLString) },
				year: { type: GraphQLInt },
			},
			resolve(parent, args) {
				const year = args.year || currentYear;
				return getHoliday(args.country, year);
			},
		},
	}
});

export default new GraphQLSchema({
	query: Query,
});

