'use strict';
var isLoggedIn = require('../modules/isLoggedIn');
var User = require('../models/user');
var Book = require('../models/book');
const shortid = require('shortid');
const formatDate = require('format-date');
const dateDifference = require('date-difference');
const sha1 = require('sha1');

module.exports = function (app, dirname, passport, env, nev) {
	require('./static')(app, dirname);
	require('./auth/local')(app, passport, nev);
	require('./api/index')(app, dirname);

	app.get('/', function (req, res) {
		if (req.isAuthenticated())
			res.render('index.authenticated.ejs', {user: req.user});
		else {
			res.render('index.ejs');
		}
	});

	app.get('/logout', isLoggedIn, function (req, res) {
		req.logout();

		res.redirect('/');
	});

	app.get('/profile', isLoggedIn, function (req, res) {
		//	User.find().populate('books.book').exec(function (err, x) {
		//console.log(x);
		//	req.user.populate('')

		res.render('profile.authenticated.ejs', {
			user: req.user,
			message: req.flash('profile.authenticated'),
			requested: req.user.getRequestedBooks()
		});
		//});
	});

	app.get('/profile/add/book', isLoggedIn, function (req, res) {
		res.render('profile.addbook.ejs', {user: req.user});
	});

	app.get('/profile/:id', function (req, res) {
		const userID = req.params.id;

		if (shortid.isValid(userID)) {
			User.findOne({
				'link': userID
			}, function (err, user) {
				if (err)
					console.error(err);

				if (user) {
					res.render('profile.ejs', {
						user: req.user,
						profile: user,
						since: formatDate('{utc-day} of {utc-month-name}, {utc-year}', user.createdAt),
						lastseen: dateDifference(user.updatedAt, new Date(), {compact: true})
					});
				} else {
					res.render('profile.invalid.ejs', {
						user: req.user,
						link: userID
					});
				}
			});
		} else {
			res.render('profile.invalid.ejs', {
				user: req.user,
				link: userID
			});
		}
	});

	app.get('*', function (req, res) {
		res.status(404).render('404.ejs', {
			user: req.user,
			link: req.url || req.originalUrl
		});
	});
}
