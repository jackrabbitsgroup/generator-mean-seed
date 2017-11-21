# Testing

## Overview
### Definitions / Types
There's LOTS of different testing definitions but in general we use 5:
1. [small] Unit
2. [medium] Integration / Midway (How different units communicate and work together. But not necessary user facing)
3. [large] End-To-End (E2E). Aka "acceptance" or "functional"
4. Multiple Device / Browser Testing (aka "UI Testing"?)
5. [large] Performance (speed, capacity, security). Aka "nonfunctional acceptance/E2E"

### Manual vs Automated
- Automate as much as possible but some manual will be necessary (typically on UI/device testing and on acceptance testing where we get in front of real users and demo it). A last type of testing may thus be called �usability / exploratory testing� - this is manual testing and showcasing.

### Local / Single Configuration vs Remote / Multiple Configurations
- Want BOTH:
	- fast, local, and free tests to be run (i.e. with grunt) while developing. These will be run frequently and will thus only be run on 1 Operating System and typically only 1 or a select few browsers / platforms. This ensures things work in ONE environment and prior to commiting code BUT this is not sufficient for production use as it's not robustly tested enough across many platforms (operating systems + browser combinations).
	- remote, multiple operating system and browser tests (i.e. SauceLabs / Selenium Grid). These will be more expensive (both in terms of time and money) so should only be run selectively (i.e. upon push to staging servers - with Continuous Integration it would be after each Git commit and that should only be done AFTER the tests are run and pass locally (one ONE configuration) - no point in testing on multiple configurations if it doesn't even work on one yet).

### Tools
- Jasmine (both for backend and frontend)
- Karma (test runner - now only used for AngularJS unit tests)
	- PhantomJS
- Protractor (AngularJS E2E tests)
	- Selenium
		- install: AFTER installing Protractor (locally - run `npm install`) - `./node_modules/protractor/bin/webdriver-manager update`
- Browsers / browser drivers
	- PhantomJS
		- install: download it from the web or for linux: npm install phantomjs (may need to do it locally - in which case put it in package.json)
	- ChromeDriver (comes/auto installed with selenium standalone installation)

	
## Coverage
See [test-coverage.md](test-coverage.md)


## Backend
### Jasmine Node
	- make sure to have the test server running

## Frontend

### Jasmine / Protractor for end-to-end (E2E) tests
- Protractor
	- install Selenium server (for standalone / local running)
		- `./node_modules/protractor/bin/webdriver-manager update`
	- install JRE (Java Runtime Environment) and add it to your system PATH if you don't already have it - so you can run `java` commands from the command line.
		- http://www.oracle.com/technetwork/java/javase/downloads/index.html
			- click the 'JRE' download button then select the version that matches your environment / operating system
			- download then install
			- add to your system PATH
	- 3 ways to use with Selenium
		- standalone (local)
			- `node_modules/protractor/bin/protractor app/src/config/protractor.conf.js`
		- web address to Selenium server (can be local or remote)
			- for local:
				- in 1 command prompt window, start the selenium server: `java  -p 4444 -Dwebdriver.chrome.driver=selenium/chromedriver -jar selenium/selenium-server-standalone-3.7.1.jar`
					- NOTE: on Windows, need to put '.exe' at the end of chromedriver otherwise it won't work
				- then in the 2nd command prompt window, run protractor as usual (once you've updated the protractor config file to use the selenium address - use the address that is displayed when running the standalone server directly from above) `node_modules/protractor/bin/protractor app/src/config/protractor.conf.js`
					- NOTE: on Windows, can usually just use 'http://localhost:4444/wd/hub' even if the standalone starting url is not that (i.e. if it's 'http://192.168.1.6:4444/wd/hub')
		- SauceLabs
	- once you've installed Protractor and Selenium (if you're using a local / standalone selenium server), run protractor by typing the path to the protractor (executable) and the path to the protractor config file after that, i.e. `node_modules/protractor/bin/protractor app/src/config/protractor.conf.js`
		- this should start the selenium server, appropriate web drivers / browsers, and run the tests
		- NOTE: I could NOT get PhantomJS working.. seems to be a timing issue since got "Angular undefined" or something like that. I tried waitForAngular and sleep and one time it worked but I couldn't consistently get it to work. `wait` may work but need to know the condition to check/return true once Angular is loaded/ready..
			- so as of now I only have it working with chromedriver
		
	- running with grunt - this was NOT easy (on Windows at least)
		- there aren't a lot of grunt-protractor npm plugins, the only one seems to be grunt-protractor-runner, but that doesn't work on Windows (just get an ENOENT error)
		- instead, need to use grunt-shell task to run it directly with a DIFFERENT path - to the node_modules/.bin folder, which has a protractor.cmd file (for Windows) in it; without that it doesn't work. AND pointing the grunt-protractor-runner to this Windows path still doesn't work anyway..
			- https://github.com/angular/protractor/issues/17
			
	- SauceLabs & parallelization (running on multiple platforms (browser/version/operating system combinations) at once)
		- currently using grunt-parallel with multiple Protractor configuration files to achieve this since Protractor doesn't seem to support this natively.
			- tried with grunt-shell '&' which supposedly runs in parallel but that didn't work
			- Selenium Grid and SauceLabs plugin may work but again isn't Protractor specific so I didn't try it
			- FYI: SauceLabs limits the number of tests that can be run in parallel (2 for free account, etc.) so beware of that
			
	- (multiple) device/browser/UI testing - automated? w/ SauceLabs?
		- UNFORTUNATELY it doesn't seem to be reliably working - it DOES seem to always work with Chrome, but IE fails a lot and Firefox is intermittent. Android & iOS failed big time (iOS timed out)..
			- So at this point we either need different solutions - some combination of 3rd party (i.e. SauceLabs alternative), Protractor (different test runner/system) and/or my code (maybe there's something I can do to the tests/code to get them to work 100% of the time and be reliable?
				- Plus SauceLabs is expensive - to get more than 5 parallization and more than 400 Mac/iOS minutes, it costs $149/mo! One single test is taking about a minute so if a full test suite took 10 minutes (could be much longer?!) and was run once per day (which may be low - especially with Continuous Integration it could be run many times per day..) that would be 300 minutes per month right there with just ONE platform (i.e. iOS6 iPhone). So we could easily go over the 400 minutes monthly iOS limit..
				- For now though, I'll just stick with local testing on Chrome (free, fast, reliable) even though it's just ONE platform
					- could also add in other browser drivers (Firefox, IE) to get a bit more coverage; but still just one operating system and no phone/tablet/other device auto testing
					
		- Android device with Android Driver
			- http://www.packtpub.com/library/recipes-to-master-selenium-2-testing-tools-cookbook/ch07lvl1sec86#
			- if you get a 'cannot bind socket' when trying to do the port forward step, kill whatever is running on port 8080 by going to http://localhost:8080/exit in a browser - http://selenium.10932.n7.nabble.com/Re-error-cannot-bind-socket-is-observed-while-Executing-this-command-adb-forward-tcp-8080-tcp-8080-td23083.html
				- I tried using a different port but that didn't seem to work - though maybe I was doing it wrong..?
			- doesn't currently work on Android with Protractor..?
				- https://github.com/angular/protractor/issues/105
		
	- usage:
		- protractor API: https://github.com/angular/protractor/blob/master/docs/api.md
			- xpath syntax: http://www.w3schools.com/xpath/xpath_syntax.asp
			- gotchas:
				- use '//' to start otherwise have to go from the root (i.e. '/html/body/..')
				- nth-child: apparently only (1) works for nested nth-child or nth-last-child?? wtf? i.e. 'div:nth-child(1) div:nth-child(2)' does NOT seem to work but 'div:nth-child(1) div:nth-last-child(1)' OR 'div:nth-child(1) div:nth-child(1)' does???
					- instead need to use xpath BUT for classes need to use 'contain' in case it also has other classes..
						- "div[contains(concat(' ', @class, ' '), ' login-signup ')]" NOT "div[@class='login-signup']"
							- http://stackoverflow.com/questions/8619869/xpath-wildcard-in-attribute-value
				- timeouts (i.e. $timeout), especially in endless loops (i.e. for cycling through slides infinitely) will break Protractor as it will wait infinitely for the page to finish "loading". Apparently there was/is the same issue on Angular Scenario Runner and it's a general E2E testing challenge - how to know when page is "done"?
					- https://github.com/angular/protractor/issues/49
		- http://docs.seleniumhq.org/docs/03_webdriver.jsp#selenium-webdriver-api-commands-and-operations
		- drivers (among other things) https://code.google.com/p/selenium/w/list
	- videos & links
		- http://www.youtube.com/watch?v=UYVcY9EJcRs
		- http://www.youtube.com/watch?v=idb6hOxlyb8
			- slides: https://docs.google.com/presentation/d/1QWFnYAur19R7RQ5KkLkLDMOMz5jrzNlBId3XBrwRNs8/edit
		- http://release.seleniumhq.org/selenium-remote-control/0.9.2/doc/dotnet/Selenium.html
		- http://www.w3.org/TR/2001/CR-css3-selectors-20011113/

### Jasmine / Karma for unit & end-to-end (E2E) tests - UPDATE - switched to Protractor for E2E tests so only using this for unit tests
- Gotchas:
	- for E2E tests: make sure to have the server running and set the "proxies" to the web url
	- make sure to install karma-ng-scenario NPM module (via package.json - installing globally didn't seem to work for me)
	- install PhantomJS for "headless" testing (so don't need a browser open - this makes configuration easier and is required for running tests via the command line without extra steps (i.e. via Grunt and Continuous Integration)
	- make sure your Karma (NPM) module and dependencies are up to date and matched with the proper configuration files (one config file for unit tests and one for E2E tests). See here for example working configs:
		- app/src/config
			- karma.conf.js
			- karma-e2e.conf.js
		- Gruntfile.js (in the Karma section)
