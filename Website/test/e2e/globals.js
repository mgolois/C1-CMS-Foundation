var timeouts = {
		basic: 20000,
		save: 240000,
		little: 2000,
	};
module.exports = {
	timeouts : timeouts,
	beforeEach: function (browser, done) {
		browser.resizeWindow(1400, 1000, done);
	},
	afterEach: function (browser, done) {
		browser.end(done);
	}
}
