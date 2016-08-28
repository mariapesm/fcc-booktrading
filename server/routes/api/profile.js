'use strict'

const isLoggedIn = require('../../modules/isLoggedIn');
var google = require('googleapis');
var bookAPI = google.books('v1');
var Book = require('../../models/book');

module.exports = function (app, dirname) {
	//add
	app.post('/profile/add/book', isLoggedIn, function (req, res) {
		req.session.temp = [];

		if (req.body.custom) {
			var book = new Book();
			var books = [];

			req.session.temp.push(book.createCustom(req.body));
			books.push(book);
			res.render('profile.addbook.result.ejs', {
				user: req.user,
				results: books
			});
		} else {
			var query = req.body.query;

			if (query) {
				bookAPI.volumes.list({
					q: query,
					key: process.env.GOOGLEBOOKS_API_KEY
				}, function (err, response) {
					if (err)
						console.error(err);

					var books = [];
					response.items.forEach(elem => {
						let book = new Book();
						books.push(book.create(elem));
					});

					req.session.temp = books;

					if (!response.items) {
						res.status(404).send(null);
					} else {
						res.render('profile.addbook.result.ejs', {
							user: req.user,
							results: books
						});
					}
				});
			} else {
				res.render('profile.addbook.ejs', {user: req.user});
			}
		}
	});

	app.post('/profile/add/book/approve', isLoggedIn, function (req, res) {
		var tempBookCollection = req.session.temp;
		var chosenBooks = req.body;

		if (chosenBooks.length >= 1) {
			var user = req.user;
			for (let i = 0; i < chosenBooks.length; i++) {
				user.findAndAddBook(chosenBooks[i], tempBookCollection)
			}

			user.save(function (err) {
				if (err) {
					console.error(err);
				}
				res.send(true);
			});
		} else {
			res.send(false);
		}
	});

	//delete
	app.post('/profile/delete/books', isLoggedIn, function (req, res) {
		console.log("But whyyyyy 3");
		console.log(req.body); //array of book IDs.

		//delete book from user
		//delete book from books collection

		res.send(true);
	});

	//update
	app.post('/profile/update/', isLoggedIn, function (req, res) {
		var user = req.user;
		const action = req.body.update;

		if (action === "update") {
			user.changeInformation('picture', req.body.picture);
			//user.changeInformation('email', req.body.email);
			user.changeInformation('city', req.body.city);
			user.changeInformation('phone', req.body.phone);
			user.changeInformation('description', req.body.description);
			user.changeConfigs({publicInformation: req.body.publicInformation, hideDescription: req.body.hideDescription, theme: req.body.theme});
			user.save(function (err) {
				if (err) {
					console.error(err);
					req.flash('profile.authenticated', err.message);
				} else {
					req.flash('profile.authenticated', "Updated user profile information.");
					req.user = user;
				}
				res.redirect('/profile');
			});
		} else if (action === "deletebooks") {
			user.changeInformation('books', []);
			user.save(function (err) {
				if (err) {
					console.error(err);
					req.flash('profile.authenticated', err.message);
				} else {
					req.user = user;
					req.flash('profile.authenticated', "Deleted all user owned books from profile.");
				}
				res.redirect('/profile');
			});
		} else if (action === "deleteaccount") {
			console.log("Deleting account " + user.id);
			user.remove(function (err) {
				if (err) {
					console.error(err);
					res.redirect('/profile');
				} else {
					req.logout();
					res.redirect('/');
				}
			});
		} else {
			console.error("Invalid form action on profile update by user " + user.id + ": " + action);
			res.redirect('/profile');
		}
	});
}

//<% if(! (book.hash == 'null')) { %> < svg width = "80" height = "80" data - jdenticon - hash = "<%= book.hash %>" > </svg><% } %> < script src = "/js/jdenticon.js" > </script>
