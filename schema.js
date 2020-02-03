const axios = require('axios');
const {
	GraphQLSchema,
	GraphQLNonNull,
	GraphQLString,
	GraphQLObjectType,
	GraphQLInt,
	GraphQLList,
} = require('graphql');
//const API_KEY = '6a4269bf85c8aa1c01398b3bb2b1b285a6353162';
const API_KEY = '45b7e2b66c72ae40c9da0187cc6df876a6639f59';
const currentYear = new Date().getFullYear();

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
		// TODO: Impove getting holidays for each country
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
						return axios.get('https://calendarific.com/api/v2/holidays', {
							params: {
								api_key: API_KEY,
								country: country.iso_3166,
								year
							}
						}).then(res => {
							const holidays = res.data.response.holidays;
							holidays.forEach(holiday => {
								holiday.date = holiday.date.iso;
							});


							return (country.holidays = holidays);
						});

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
				return axios.get('https://calendarific.com/api/v2/holidays', {
					params: {
						api_key: API_KEY,
						country: args.country,
						year
					}
				}).then(res => {
					const holidays = res.data.response.holidays
					holidays.forEach(holiday => {
						holiday.date = holiday.date.iso;
					});

				});
			},
		},
	}
});

module.exports = new GraphQLSchema({
	query: Query,
});

