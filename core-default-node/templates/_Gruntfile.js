/**
@module grunt
@class grunt

@toc
1. config versioning setup
2. load grunt plugins
3. init
4. setup variables
5. grunt.initConfig
6. register grunt tasks
	6.1. outputCoverage

NOTE: use "grunt --type=prod" to run production version
NOTE: use "grunt --config=test" to run with a 'config-test.json' file instead of the default 'config.json' file. You can change 'test' to whatever suffix you want. This allows creating multiple configurations and then running different ones as needed.
NOTE: Karma test runner & coverage: right now with `reporters: ['coverage'],` set, get no karma test output (on failure) to the console.. but without that line it can't create the `coverage-angular` folder and coverage errors..
	- So, we currently need TWO different karma configuration files.. one with coverage and one without..
NOTE: Node test coverage: the coverage only runs on 'process.exit' so with 'forceExit' set to false (which we need to be able to run other tasks after the node backend tests are run), we need to manually call process.exit (with the grunt-exit task) at the end - otherwise the coverage report won't show on the console AND it won't fail the task if below the required code coverage!!!

Usage:
The core call(s) to always do before commiting any changes:
`grunt` - builds, lints, concats, minifies files, runs tests, etc.
	- NOTE: since this runs the frontend Karma server tests, this will NOT auto-complete; use Ctrl+C to exit the task once it runs and you see the 'SUCCESS' message for all tests passing

Other calls (relatively in order of importantance / most used). Scroll to the bottom to see a full list of all tasks.
- dev
	`grunt dev` for watching and auto-running build and tests
	`grunt dev-test` for watching and auto-running TESTS only
	`grunt dev-karma-cov` for watching and auto-running karma unit test COVERAGE (since dev-test does NOT run coverage due to issue..). To see / generate coverage, run this AND 'dev-test' OR 'dev' (in 2 separate command windows)
	`grunt dev-build` for watching and auto-running BUILD (i.e. `grunt q`) only
- test
	`grunt karma-cov` to run/build karma/angular coverage report (since grunt dev watch task does NOT do this due to a bug/issue with karma where running the coverage does NOT show test info on the console, which makes it annoying to debug)
	`grunt e2e` to run protractor/node_modules/webdriver-manager/selenium e2e frontend tests
	`grunt test-frontend` - run all frontend tests (unit & e2e)
	`grunt node-cov` to run just backend node tests AND do coverage (show report and fail if below threshold) - only this task will actually show coverage and fail on the CONSOLE but the coverage report will always be written
	`grunt test-backend` to just test backend - NOTE: there's really no reason to use this; just use `node-cov` or `test-backend-dev` instead.
	`grunt test-backend-dev` to just test backend WITHOUT running/require'ing run.js - you'll have to manually run `node run.js config=test` in a separate command prompt window first. This is mostly for development so it runs a bit faster and the test output is all together in one command prompt window rather than interspersed with the server output.
	`grunt test` - runs ALL tests
	`grunt test-cov` - runs ALL tests AND guarantees (node) test coverage validation/console output BUT won't always (ever?) complete grunt so won't get "done, without errors" and Continuous Integration won't complete so only use this in development
- build / lint
	`grunt q` for quick compiles (doesn't run tests or build yui docs)
	`grunt q-watch` for even quicker compiles/builds
	`grunt noMin` a quick compile that also builds main.js and main.css (instead of main-min versions) - good for debugging/development.
	`grunt lint-backend` to just lint backend
- docs
	`grunt yui` - generate YUIDoc auto documentation

Lint, concat, & minify (uglify) process (since ONLY want to lint & minify files that haven't already been minified BUT want concat ALL files (including already minified ones) into ONE final file)
1. lint all non-minified (i.e. custom built as opposed to 3rd party) files
2. minify these custom built files (this also concats them into one)
3. concat all the (now minified) files - the custom built one AND all existing (3rd party) minified ones

*/

'use strict';

var fs = require('fs');

/**
Config versioning setup and defaults
@toc 1.
*/

/**
Hardcoded versions that should match config.json versions - used to prevent grunt from running until config.json and npm install are up to date
Since config.json isn't under version control, if make (breaking) changes, config.json needs to be updated manually on each environment and without doing so can cause (serious) errors so this prevents that from happening.
Likewise, `npm install` must be run per server so this ensures packages are up to date.
So each time package.json or config.json is changed, increment the version both in config.json and here.

@property curVersions
@type Object
*/
var curVersions ={
	"cfg": "0.0.0",
	"pkg": "0.0.0"
};
// var configFile = require('./app/configs/config.json');
var configFile ='./app/configs/config.json';

/*
//path setting not working (on Windows at least) so don't use environment variables; just use a simpler (optional) config file that sets what config file to use
console.log("process.env['ENV_CONFIG']: "+process.env['ENV_CONFIG']);
if(process.env['ENV_CONFIG'] !==undefined) {
	configFile ='./app/configs/config-'+process.env['ENV_CONFIG']+'.json';
}
*/

//check to see if config_environment file exists and use it to load the appropriate config.json file if it does
var configFileEnv ='./config_environment.json';
if(fs.existsSync(configFileEnv)) {
	var cfgJsonEnv =require(configFileEnv);
	if(cfgJsonEnv && cfgJsonEnv !==undefined && cfgJsonEnv.environment !==undefined && cfgJsonEnv.environment.length >0) {
		configFile ='./app/configs/config-'+cfgJsonEnv.environment+'.json';
	}
}

var dirpath = __dirname;

module.exports = function(grunt) {

	/**
	Load grunt plugins
	@toc 2.
	*/
	grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
	<%
	if(optCssPreprocessor =='less') {
		print("grunt.loadNpmTasks('grunt-contrib-less');");
	}
	else if(optCssPreprocessor =='scss') {
		print("grunt.loadNpmTasks('grunt-contrib-compass');");
	}
	%>
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');
    grunt.loadNpmTasks('grunt-buildfiles');
	// grunt.loadNpmTasks('grunt-jasmine-node');
	grunt.loadNpmTasks('grunt-jasmine-node-coverage-validation');
	grunt.loadNpmTasks('grunt-istanbul-coverage');
	// grunt.loadNpmTasks('grunt-html2js');
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-copy');
	// grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-shell-spawn');
	grunt.loadNpmTasks('grunt-parallel');
	grunt.loadNpmTasks('grunt-forever-multi');
	// grunt.loadNpmTasks('grunt-wait');
	grunt.loadNpmTasks('grunt-font-awesome-vars');
	grunt.loadNpmTasks('grunt-http');
	grunt.loadNpmTasks('grunt-focus');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-exit');
	grunt.loadNpmTasks('grunt-dev-update');


	/**
	Function that wraps everything to allow dynamically setting/changing grunt options and config later by grunt task. This init function is called once immediately (for using the default grunt options, config, and setup) and then may be called again AFTER updating grunt (command line) options.
	@toc 3.
	@method init
	*/
	function init(params) {
		/**
		Setup variables
		@toc 4.
		*/
		grunt.log.writeln('init');

		//allow changing config file based on comman line options
		if(grunt.option('config')) {
			// grunt.log.writeln('config: '+grunt.option('config'));
			configFile ='./app/configs/config-'+grunt.option('config')+'.json';
		}
		grunt.log.writeln('configFile: '+configFile);

		// var cfgJson = configFile;
		var cfgJson =require(configFile);
		// global.cfgJson = cfgJson;

		//get test config as well
		//insert a '.test' at the end of the config as the test config naming convention
		var configTestFile =configFile.slice(0, configFile.lastIndexOf('.'))+'.test'+configFile.slice(configFile.lastIndexOf('.'), configFile.length);
		var cfgTestJson =require(configTestFile);


		// hardcoded paths
		var protractorPath ='node_modules/protractor/bin/protractor';		//non-Windows
		var pathPrefix ='';
		pathPrefix ='node_modules/protractor/';
		var seleniumStartupParts =['java', '-p', '4444', '-Dwebdriver.chrome.driver='+pathPrefix+'selenium/chromedriver', '-jar', pathPrefix+'node_modules/webdriver-manager/selenium/selenium-server-standalone-3.7.1.jar'];
		if(cfgJson.operatingSystem !==undefined && cfgJson.operatingSystem =='windows') {
			pathPrefix ='node_modules\\protractor\\';
			protractorPath ='node_modules\\.bin\\protractor';		//Windows
			seleniumStartupParts =['java', '-p', '4444', '-Dwebdriver.chrome.driver='+pathPrefix+'selenium\\chromedriver.exe', '-jar', pathPrefix+'node_modules\\webdriver-manager\\selenium\\selenium-server-standalone-3.7.1.jar'];
		}
		var seleniumStartup =seleniumStartupParts.join(' ');
		var seleniumStartupCmd =seleniumStartupParts[0];
		var seleniumStartupArgs =seleniumStartupParts.slice(1, seleniumStartupParts.length);

		var seleniumShutdown ='http://localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer';		//do NOT need to use config server.scheme here?

		var publicPathRelativeRootNoSlash ="app/src";
		var publicPathRelativeRoot =publicPathRelativeRootNoSlash+"/";

		var buildfilesPaths ={
			modules: publicPathRelativeRoot+'config/buildfilesModules.json',
			moduleGroups: publicPathRelativeRoot+'config/buildfilesModuleGroups.json'
		};
		var buildfilesModules = require('./'+buildfilesPaths.modules);		//the file with the object/arrays of all modules (directories and files to form paths for (css, js, html))
		var buildfilesModuleGroups = require('./'+buildfilesPaths.moduleGroups);

		var publicPathRelative = publicPathRelativeRoot;
		var publicPathRelativeDot = "./"+publicPathRelative;		//the "./" is necessary for some file paths to work in grunt tasks

		//relative to publicPathRelativeRoot folder (prepend this when using it)
		var pathsPhonegap ={
			android: "deploys/phonegap/platforms/android/assets/www",
			ios: "deploys/phonegap/platforms/ios/assets/www"
		};

		var serverPath = cfgJson.server.serverPath;
		var appPath = cfgJson.server.appPath;
		var staticPath = cfgJson.server.staticPath;

		//publicPathRelative will be prepended
		var buildDir ="build";
		var paths = {
			'concatJs':buildDir+"/main.js",
			'concatCss':buildDir+"/main.css",
			'minJs':buildDir+"/main-min.js",
			'minCss':buildDir+"/main-min.css"
		};
		var buildPath =publicPathRelative+buildDir;

		var config ={
			customMinifyFile:   buildPath+'/temp/custom.min.js',
			customFile:         buildPath+'/temp/custom.js'
			//concatFilesExt:    ['common/ext/*.js'],
			//concatFiles:       [],
			//will be built below as combination of concatFilesExt and customMinifiyFile
			//concatFilesMin:    []
		};

		//set coverage thresholds (set to variable so can be over-written if need by without touching cfgJson)
		var testCov ={
			jasmine_node: cfgJson.test_coverage.jasmine_node,
			angular_karma: cfgJson.test_coverage.angular_karma
		};

		//declare config that will be used more than once to keep code DRY
		var jsHintBackendConfig ={
			options: {
				//define jasmine test globals: http://pivotallabs.com/running-jshint-from-within-jasmine/
				globals: {
					after:      false,
					before:     false,
					afterEach:  false,
					beforeEach: false,
					//confirm:    false,
					//context:    false,
					describe:   false,
					expect:     false,
					it:         false,
					//jasmine: false,
					//JSHINT: false,
					//mostRecentAjaxRequest: false,
					//qq: false,
					//runs: false,
					spyOn:      false,
					spyOnEvent: false,
					waitsFor:   false,
					xdescribe:  false,
					xit:        false
				}
			},
			files: {
				src: ['app/*.js', 'app/test/**/*.js', 'app/modules/**/*.js', 'app/routes/**/*.js']
			}
		};

		//config.concatFilesMin =config.concatFilesExt.concat(config.customMinifyFile);
		//config.concatFiles =config.concatFilesExt.concat(config.customFile);

		/**
		Project configuration.
		@toc 5.
		*/
		grunt.initConfig({
			customMinifyFile:   config.customMinifyFile,
			customFile:         config.customFile,
			pkg:                grunt.file.readJSON('package.json'),
			//will be filled/created in buildfiles task
			lintFilesJs:        [],
			//cfgJson: grunt.file.readJSON('package.json'),
			cfgJson:            cfgJson,
			cfgTestJson:            cfgTestJson,
			//will be filled/created in buildfiles task
			filePathsJs:        '',
			filePathsJsTestEnv: '',
			//will be filled/created in buildfiles task
			filePathsCss:       '',
			<%
			if(optCssPreprocessor =='less') {
				print("filePathsLess: '',");
			}
			else if(optCssPreprocessor =='scss') {
				print("filePathsScss: '',");
			}
			%>
			filePathConcatJs:   staticPath+paths.concatJs,
			filePathConcatCss:  staticPath+paths.concatCss,
			filePathsJsNoPrefix:        '',		//will be filled/created in buildfiles task
			filePathsCssNoPrefix:        '',		//will be filled/created in buildfiles task
			filePathsJsTestUnitNoPrefix: '',		//for karma .spec files to test
			filePathsJsTest: {
				karmaUnitCoverage: ''
			},
			filePathsTestProtractor: '',
			filePathMinJs:      staticPath+paths.minJs,
			filePathMinCss:     staticPath+paths.minCss,
			//lessDirPathRoot: '../'+cfgJson.serverPath,        //mobile phonegap
			<%
			if(optCssPreprocessor =='less') {
				print("lessDirPathRoot:    cfgJson.less.dirPathRootPrefix+staticPath,");
			}
			else if(optCssPreprocessor =='scss') {
				print("scssDirPathRoot:    cfgJson.scss.dirPathRootPrefix+staticPath,");
			}
			%>
			serverPath:             serverPath,
			staticPath:             staticPath,
			publicPathRelativeRoot: publicPathRelativeRoot,
			publicPathRelative:     publicPathRelative,
			publicPathRelativeDot:  publicPathRelativeDot,
			buildPath:	buildPath,
			buildPathIndexHtml: staticPath+buildDir+'/',
			buildfiles: {
				// customMinifyFile:   config.customMinifyFile,
				buildfilesModules: buildfilesModules,		//define where your list of files/directories are for all your build assets
				buildfilesModuleGroups: buildfilesModuleGroups,

				//this takes your buildfiles modules and moduleGroups of all js, css, html, etc. files and generates full paths to all these build assets then stuffs them into other grunt task file paths.
				configPaths: {
					//generic file lists for use elsewhere
					noPrefix: {
						// prefix: '',
						moduleGroup: 'allNoBuildCss',
						outputFiles: {
							js: ['filePathsJsNoPrefix'],
							css: ['filePathsCssNoPrefix'],
							testUnit: ['filePathsJsTestUnitNoPrefix']
						}
					},
					//karma unit test files but with prefix for use in other grunt tasks
					karmaUnitGruntTasksPrefix: {
						prefix: publicPathRelativeDot,
						moduleGroup: 'allNoBuildCss',
						outputFiles: {
							js: ['watch.karmaUnitJs.files', 'watch.karmaUnit.files', 'watch.karmaCovUnit.files'],
							testUnit: ['watch.karmaUnitTest.files', 'watch.karmaUnit.files', 'watch.karmaCovUnit.files']
						}
					},
					karmaUnitCoverage:{
						moduleGroup: 'testsKarmaCov',
						outputFiles: {
							js: ['filePathsJsTest.karmaUnitCoverage']
						}
					},
					//index.html file paths (have the static path prefix for use in <link rel="stylesheet" > and <script> tags)
					indexFilePaths:{
						prefix: cfgJson.server.staticPath,
						moduleGroup: 'allNoBuildCss',
						outputFiles: {
							js: ['filePathsJs'],
							css: ['filePathsCss']
						}
					},
					//index.html file paths (have the static path prefix for use in <link rel="stylesheet" > and <script> tags)
					indexTestEnvFilePaths:{
						prefix: cfgJson.server.staticPath,
						moduleGroup: 'allNoBuildCssTestEnv',
						outputFiles: {
							js: ['filePathsJsTestEnv']
						}
					},
					<%
					if(optCssPreprocessor =='less') {
						print("//_base.less file paths (have a prefix path relative to this file for @import)\n"+
						"\t\t\t\t\tlessFilePaths:{\n"+
							"\t\t\t\t\t\tprefix: '../../',\n"+
							"\t\t\t\t\t\tmoduleGroup: 'allNoBuild',\n"+
							"\t\t\t\t\t\toutputFiles: {\n"+
								"\t\t\t\t\t\t\tless: ['filePathsLess']\n"+
							"\t\t\t\t\t\t}\n"+
						"\t\t\t\t\t},");
						print("//for watch task - need a prefix\n"+
						"\t\t\t\t\tlessFilePathsPrefix:{\n"+
							"\t\t\t\t\t\tprefix: publicPathRelativeDot,\n"+
							"\t\t\t\t\t\tmoduleGroup: 'allNoBuild',\n"+
							"\t\t\t\t\t\toutputFiles: {\n"+
								"\t\t\t\t\t\t\tless: ['watch.less.files', 'watch.build.files']\n"+
							"\t\t\t\t\t\t}\n"+
						"\t\t\t\t\t},");
					}
					else if(optCssPreprocessor =='scss') {
						print("//@todo - _base.scss file paths (have a prefix path relative to this file for @import)\n"+
						"\t\t\t\t\tscssFilePaths:{\n"+
							"\t\t\t\t\t\tprefix: '../../',\n"+
							"\t\t\t\t\t\tmoduleGroup: 'allNoBuild',\n"+
							"\t\t\t\t\t\toutputFiles: {\n"+
								"\t\t\t\t\t\t\tscss: ['filePathsScss']\n"+
							"\t\t\t\t\t\t}\n"+
						"\t\t\t\t\t},");
						print("//for watch task - need a prefix\n"+
						"\t\t\t\t\tscssFilePathsPrefix:{\n"+
							"\t\t\t\t\t\tprefix: publicPathRelativeDot,\n"+
							"\t\t\t\t\t\tmoduleGroup: 'allNoBuild',\n"+
							"\t\t\t\t\t\toutputFiles: {\n"+
								"\t\t\t\t\t\t\tscss: ['watch.scss.files', 'watch.build.files']\n"+
							"\t\t\t\t\t\t}\n"+
						"\t\t\t\t\t},");
					}
					%>
					//list of files to lint - will be stuffed into jshint grunt task variable(s)
					jshint:{
						prefix: publicPathRelativeDot,
						moduleGroup: 'nonMinifiedLint',
						outputFiles: {
							js: ['jshint.beforeconcat.files.src', 'jshint.beforeconcatQ.files.src', 'watch.jsHintFrontend.files', 'watch.build.files']
						}
					},
					//list of js files to concatenate together - will be stuffed into concat grunt task variable(s)
					concatJsMin: {
						prefix: publicPathRelativeDot,
						moduleGroup: 'allMinified',
						outputFiles: {
							js: ['concat.devJs.src']
						}
					},
					//list of css files to concat - will be stuffed into concat grunt task variable(s)
					concatCss: {
						prefix: publicPathRelativeDot,
						moduleGroup: 'allNoBuildCss',
						outputFiles: {
							css: ['concat.devCss.src', 'cssmin.dev.src']
						}
					},
					//list of files to uglify - will be stuffed into uglify grunt task variable(s)
					uglify:{
						prefix: publicPathRelativeDot,
						moduleGroup: 'nonMinified',
						uglify: true,
						outputFiles: {
							js: ['uglify.build.files']
						}
					},
					//list of html templates to join together to stuff in AngularJS $templateCache - will be stuffed into ngtemplates grunt task variable(s)
					templates: {
						prefix: publicPathRelativeDot,
						moduleGroup: 'allNoBuild',
						outputFiles: {
							html: ['ngtemplates.main.src', 'watch.html.files', 'watch.build.files']
						}
					},
					concatJsNoMin: {
						prefix: publicPathRelativeDot,
						moduleGroup: 'allNoBuild',
						outputFiles: {
							js: ['concat.devJsNoMin.src']
						}
					},
					testProtractor: {
						moduleGroup: 'testsProtractor',
						outputFiles: {
							testE2E: ['filePathsTestProtractor']
						}
					}
				},
				files: {
					indexHtml: {
						src:        publicPathRelative+"index-grunt.html",
						dest:       publicPathRelative+"index.html"
					},
					indexHtmlTestEnv: {
						src:        publicPathRelative+"index-test-grunt.html",
						dest:       publicPathRelative+"index-test.html"
					},
					indexHtmlProd: {
						ifOpts: [{key:'type', val:'prod'}],		//pass in options via command line with `--type=prod`
						src:        publicPathRelative+"index-prod-grunt.html",
						dest:       publicPathRelative+"index.html"
					},
					indexHtmlPhonegap: {
						// ifOpts: [{key:'type', val:'prod'}, {key:'config', val:'phonegap'}],		//pass in options via command line with `--type=prod`
						ifOpts:	[{key: 'config', val:'phonegap'}],
						src:        publicPathRelative+"index-phonegap-grunt.html",
						dest:       publicPathRelative+"index.html"
					},
					//TriggerIO version - NOTE: for production builds this ALSO writes to index.html so this MUST be after the indexHtml task above since these writes overwrite each other!
					indexHtmlTriggerIO: {
						ifOpts:	[{key: 'config', val:'triggerio'}],
						src:        publicPathRelative+"index-triggerio-grunt.html",
						dest:       publicPathRelative+"index.html"
					},
					<%
					if(optCssPreprocessor =='less') {
						print("baseLess: {\n"+
							"\t\t\t\t\t\tsrc: publicPathRelative+'common/less/_base-grunt.less',\n"+
							"\t\t\t\t\t\tdest: publicPathRelative+'common/less/_base.less'\n"+
						"\t\t\t\t\t},");
					}
					else if(optCssPreprocessor =='scss') {
						print("baseScss: {\n"+
							"\t\t\t\t\t\tsrc: publicPathRelative+'common/scss/_base-grunt.scss',\n"+
							"\t\t\t\t\t\tdest: publicPathRelative+'common/scss/base.scss'\n"+
						"\t\t\t\t\t},");
					}
					%>
					// touchHtml: {
						// src:        publicPathRelative+"partials/resources/touch-grunt.html",
						// dest:       publicPathRelative+"partials/resources/touch.html"
					// },
					// noTouchHtml: {
						// src:        publicPathRelative+"partials/resources/no-touch-grunt.html",
						// dest:       publicPathRelative+"partials/resources/no-touch.html"
					// },
					appConfig: {
						src:        publicPathRelative+"modules/services/config/config-grunt.js",
						dest:       publicPathRelative+"modules/services/config/config.js"
					},
					appConfigTestEnv: {
						src:        publicPathRelative+"modules/services/config/config-test-grunt.js",
						dest:       publicPathRelative+"modules/services/config/config-test.js"
					},
					karmaUnit: {
						src:        publicPathRelativeRoot+"config/karma.conf-grunt.js",
						dest:       publicPathRelativeRoot+"config/karma.conf.js"
					},
					karmaUnitNoCoverage: {
						src:        publicPathRelativeRoot+"config/karma-no-coverage.conf-grunt.js",
						dest:       publicPathRelativeRoot+"config/karma-no-coverage.conf.js"
					},
					<%
					if(optCssPreprocessor =='less') {
						print("less: {\n"+
							"\t\t\t\t\t\tsrc: publicPathRelative+'common/less/variables/_dir-paths.tpl',\n"+
							"\t\t\t\t\t\tdest: publicPathRelative+'common/less/variables/_dir-paths.less'\n"+
						"\t\t\t\t\t},");
					}
					else if(optCssPreprocessor =='scss') {
						print("scss: {\n"+
							"\t\t\t\t\t\tsrc: publicPathRelative+'common/scss/variables/_dir-paths.tpl',\n"+
							"\t\t\t\t\t\tdest: publicPathRelative+'common/scss/variables/_dir-paths.scss'\n"+
						"\t\t\t\t\t},");
					}
					%>
					protractorDefault: {
						src: publicPathRelative+"config/protractor.conf-grunt.js",
						dest: publicPathRelative+"config/protractor/protractor.conf.js",
						templateData: {
							protractorCaps: {
								'browserName': 'chrome',
								'resolution': '1024x768',
								'version': '36.0',
								'os': 'Windows',
								'os_version': '7',
							}
						}
					}
				}
			},
			clean: {
				dev: [
					publicPathRelativeRoot+'coverage-node',
					publicPathRelativeRoot+'coverage-angular',
					publicPathRelativeRoot+'coverage'		//just in case for old folder name
				]
			},
			concat: {
				devCss: {
					// will be filled via buildfiles task
					src:    [],
					dest:   publicPathRelativeDot+paths.concatCss
				},
				//min version
				devJs: {
					src:    [],		// will be filled via buildfiles task
					dest:   publicPathRelativeDot+paths.minJs
				},
				devJsNoMin: {
					src:    [],		  //will be filled via buildfiles task
					dest:   publicPathRelativeDot+paths.concatJs
				}
			},
			jshint: {
				options: {
					//force:          true,
					globalstrict:   true,
					//sub:            true,
					browser:        true,
					devel:          true,
					globals: {
						angular:    false,
						$:          false,
						FB:			false,
						moment:		false,
						Lawnchair: false,
						io: false,
						//@todo - fix this?
						globalPhoneGap: false,
						forge: false,
						Pikaday: false
					}
				},
				//beforeconcat: ['common/module.js', 'modules/**/*.js'],
				//beforeconcat: config.lintFiles,
				//filled via buildfiles task
				// beforeconcat:   [],
				beforeconcat:   {
					options: {
						force:	false
					},
					files: {
						src: []		//filled via buildfiles task
					}
				},
				//quick version - will not fail entire grunt process if there are lint errors
				beforeconcatQ:   {
					options: {
						force:	true
					},
					files: {
						src: []		//filled via buildfiles task
					}
				},
				//afterconcat:    ['<%%= builddir %>/<%%= pkg.name %>.js'],
				//quick version - will not fail entire grunt process if there are lint errors
				backendQ: {
					options: {
						force: true,
						node: true,
						loopfunc: true,
						globals: jsHintBackendConfig.options.globals
					},
					files: {
						src: jsHintBackendConfig.files.src
					}
				},
				backend: {
					options: {
						force: false,
						node: true,
						loopfunc: true,
						globals: jsHintBackendConfig.options.globals
					},
					files: {
						src: jsHintBackendConfig.files.src
					}
				}
			},
			uglify: {
				options: {
					//banner: '/*! <%%= cfgJson.name %> <%%= grunt.template.today("yyyy-mm-dd") %> */\n'
					mangle: false
				},
				build: {
					// filled via buildfiles task
					files:  {}
					/*
					src:    'src/<%%= cfgJson.name %>.js',
					dest:   'build/<%%= cfgJson.name %>.min.js'
					*/
				}
			},
			<%
			if(optCssPreprocessor =='less') {
				print("less: {\n"+
					"\t\t\t\tdev: {\n"+
						"\t\t\t\t\toptions: {\n"+
							"\t\t\t\t\t\t// yuicompress: true\n"+
						"\t\t\t\t\t},\n"+
						"\t\t\t\t\tfiles: {\n"+
							"\t\t\t\t\t\t'<%%= buildPath %>/base.css': '<%%= publicPathRelative %>common/less/_base.less'\n"+
						"\t\t\t\t\t}\n"+
					"\t\t\t\t}\n"+
				"\t\t\t},");
			}
			else if(optCssPreprocessor =='scss') {
				print("compass: {\n"+
					"\t\t\t\tdev: {\n"+
						"\t\t\t\t\toptions: {\n"+
							"\t\t\t\t\t\tsassDir: publicPathRelative+'common/scss',\n"+
							"\t\t\t\t\t\tcssDir: buildPath\n"+
						"\t\t\t\t\t},\n"+
					"\t\t\t\t}\n"+
				"\t\t\t},");
			}
			%>
			cssmin: {
				dev: {
					src: [],		// will be filled via buildfiles task
					dest: publicPathRelativeDot+paths.minCss
				}
			},
			karma: {
				unit: {
					configFile:     publicPathRelativeRoot+'config/karma.conf.js',
					singleRun: true,
					browsers: ['PhantomJS']
				},
				watch: {
					configFile: publicPathRelativeRoot+'config/karma-no-coverage.conf.js',
					// singleRun: true,
					// autoWatch: true,
					background: true,		//to be used with grunt-contrib-watch task
					browsers: ['PhantomJS']
				}
				/*
				//e2e now handled with Protractor (which uses grunt-shell), NOT Karma
				e2e: {
					configFile:     publicPathRelativeRoot+'config/karma-e2e.conf.js',
					singleRun: true,
					browsers: ['PhantomJS']
				}
				*/
				/*
				unit: {
					options: {
						keepalive:      true,
						//singleRun:      true,
						configFile:     publicPathRelativeRoot+'config/karma.conf.js',
						//configFile:     'public/config/karma.conf.js',
						port:           9876,
						runnerPort:     9877
					}
				}
				*/
			},
			shell: {
				//e2e tests (with Protractor)
				protractor: {
					options: {
						stdout: true
					},
					command: protractorPath+' '+publicPathRelativeRoot+'config/protractor/protractor.conf.js'
				},
				nodeServer: {
					options: {
						stdout: true,
						async: true
					},
					command: 'node run.js config=test'
				},
				seleniumStartup: {
					options: {
						stdout: true,
						async: true
					},
					command: seleniumStartup
				}
			},
			parallel: {
				sauce: {
					options: {
						grunt: true
					},
					tasks: [
						//add grunt tasks to run here (i.e. for Selenium SauceLabs tests to run in parallel)
					]
				}
			},
			http: {
				seleniumShutdown: {
					options: {
						url: seleniumShutdown,
						ignoreErrors: true
					}
				},
				//sometimes get EADDRINUSE error.. going to the page seems to fix it..
				nodeShutdown: {
					options: {
						url: cfgTestJson.server.scheme+'://'+cfgTestJson.server.domain+':'+cfgTestJson.server.port,
						ignoreErrors: true
					}
				}
			},
			focus: {
				// build: {
					// include: ['buildfiles', 'html',
						// <%
						// if(optCssPreprocessor =='less') {
							// print("'less',");
						// }
						// else if(optCssPreprocessor =='scss') {
							// print("'scss',");
						// }
						// %>
						// 'jsHintFrontend', 'jsHintBackend']
				// },
				// test: {
					// include: ['karmaUnitJs', 'karmaUnitTest']
				// }
				build: {
					include: ['build']
				},
				test: {
					include: ['karmaUnit']
				},
				testKarmaCov: {
					include: ['karmaCovUnit']
				},
				all: {
					include: ['build', 'karmaUnit']
				}
			},
			/**
			NOTE: order matters - i.e. run tests LAST
			Apparently watch task re-runs grunt from the start so init function is called again so files are reset so MUST run buildfiles (and other stuff?) again anyway; so just run full `grunt q` as would manually be done.
				- originally tried to ONLY update / run the tasks that NEEDED to be run for speed / performance but that doesn't seem to work since buildfiles (at least) needs to be run BEFORE most other tasks anyway
			*/
			watch: {
				//combined / all call that will just re-run `grunt q` as is typically/manually done on any file change
				build: {
					files: [],		//will be filled by grunt-buildfiles
					tasks: ['q-watch'],
					options: {
						livereload: true
					}
				},
				karmaUnit: {
					files: [],		//will be filled by grunt-buildfiles
					tasks: ['karma:watch:run']
				},
				karmaCovUnit: {
					files: [],		//will be filled by grunt-buildfiles
					tasks: ['karma-cov']
				},

				//run buildfiles pretty much any time a file changes (since this generates file lists for other tasks - will this work / update them since grunt is already running??)
				buildfiles: {
					files: [
						//buildfiles json
						buildfilesPaths.modules, buildfilesPaths.moduleGroups,

						//js - don't actually need to rebuild if these change?
						// '*.js', 'app/**/*.js', '!app/configs/**/*.js', '!app/src/bower_components/**/*.js', '!app/src/build/**/*.js', '!app/src/lib/**/*.js'
					],
					// tasks: ['buildfiles']
					tasks: ['q-watch']
				},

				//build template cache for HTML partials if an HTML file changes
				html: {
					files: [],		//will be filled by grunt-buildfiles
					// tasks: ['ngtemplates:main']
					tasks: ['q-watch']
				},

				<%
				if(optCssPreprocessor =='less') {
					print("//compile less if a less file changes\n"+
						"\t\t\t\t\tless: {\n"+
						"\t\t\t\t\t\tfiles: [],		//will be filled by grunt-buildfiles\n"+
						"\t\t\t\t\t\t// tasks: ['less:dev']\n"+
						"\t\t\t\t\t\ttasks: ['q-watch']\n"+
					"\t\t\t\t},");
				}
				else if(optCssPreprocessor =='scss') {
					print("//compile scss if a scss file changes\n"+
						"\t\t\t\t\tscss: {\n"+
						"\t\t\t\t\t\tfiles: [],		//will be filled by grunt-buildfiles\n"+
						"\t\t\t\t\t\t// tasks: ['compass:dev']\n"+
						"\t\t\t\t\t\ttasks: ['q-watch']\n"+
					"\t\t\t\t},");
				}
				%>

				//lint frontend if a frontend js file changes
				jsHintFrontend: {
					files: [],		//will be filled by grunt-buildfiles
					// tasks: ['jshint:beforeconcatQ']
					tasks: ['q-watch']
				},

				//lint backend if a backend js file changes
				jsHintBackend: {
					files: ['*.js', 'app/**/*.js', '!app/configs/**/*.js', '!app/src/**/*.js'],
					// tasks: ['jshint:backendQ']
					tasks: ['q-watch']
				},

				//run tests if a code file changes
				karmaUnitJs: {
					files: [],		//will be filled by grunt-buildfiles
					tasks: ['karma:watch:run']
				},

				//run tests if a test file changes
				karmaUnitTest: {
					files: [],		//will be filled by grunt-buildfiles
					// files: ['app/src/modules/**/*.spec.js'],
					tasks: ['karma:watch:run']
				}

			},
			foreverMulti: {
				appServer: {
					action: 'restart',
					file: 'run.js',
					options: ["--uid '"+cfgJson.app.name+" port "+cfgJson.server.port+"'", "-l "+cfgJson.foreverOptions.logfile, "-a ", "--spinSleepTime 5000 ", "--minUptime 100 "]
				},
				/*
				//do no need this anymore since backend tests automatically run the test server!
				testServer: {
					// action: 'restart',		//default is restart if none specified
					file: 'run.js',
					options: ["config=test", "-m '"+cfgJson.app.name+" port "+cfgTestJson.server.port+"'"]
				}
				*/
			},
			/*
			wait: {
				afterForever: {
					options: {
						delay: 5000
					}
				}
			},
			*/
			yuidoc: {
				// NOTE: paths and outdir options (in yuidoc.json file AND/OR in options here) are apparently REQUIRED otherwise it doesn't work!
				backend:    grunt.file.readJSON('yuidoc-backend.json'),
				frontend:   grunt.file.readJSON('yuidoc-frontend.json')
			},
			jasmine_node: {
				specNameMatcher: "*", // load only specs containing specNameMatcher
				// projectRoot: "./app/test",		//doesn't work
				projectRoot: "./app",
				specFolders: ['app/modules', 'app/routes', 'app/test'],
				// specFolders: ['app/modules/controllers', 'app/routes', 'app/test'],
				requirejs: false,
				forceExit: false,		//need this to be false otherwise it just exits after this task

				coverage: {
					savePath: publicPathRelativeRoot+'coverage-node',		//needs to be a file in publicPathRelativeRoot otherwise will not be accessible to view from the node server!
					excludes: [
						// '**/modules/services/**',		//not sure what the relative path is from but using 'app/modules/services' does NOT work - only '**/modules/services/**' and 'modules/services/**' work..
						'**.test.js'
					],
					// matchall: true,
					options : {
						failTask: testCov.jasmine_node.failTask,
						branches : testCov.jasmine_node.branches,
						functions: testCov.jasmine_node.functions,
						statements: testCov.jasmine_node.statements,
						lines: testCov.jasmine_node.lines
					}
				},
				options: {
					forceExit: false,		//need this to be false otherwise it just exits after this task
					match: '.',
					matchall: false,
					// matchall: true,
					extensions: 'js',
					specNameMatcher: 'spec',
				}
			},
			coverage: {
				options: {
					thresholds: {
						branches: testCov.angular_karma.branches,
						functions: testCov.angular_karma.functions,
						statements: testCov.angular_karma.statements,
						lines: testCov.angular_karma.lines
					},
					dir: 'coverage-angular',
					root: publicPathRelativeRootNoSlash
				},
				//not really a multi task?!
				// karmaFrontend: {
				// }
			},
			ngtemplates: {
				main: {
					options: {
						//for templates to exist in grunt task need a separate prefix? so this removes it for what is needed for the actual templateCache to find the partial correctly
						url: function(url) { return url.replace(publicPathRelativeDot, staticPath); },
						module: 'myApp'
					},
					// will be filled via buildfiles task
					src: [
					],
					dest: "<%%= buildPath %>/templates.js"
				}
			},
			//see here for example, it was confusing to me how to copy a folder recursively without having the src path automatically pre-pended.. http://stackoverflow.com/questions/13389952/flattening-of-file-tree-when-using-grunt-copy-task
			copy: {
				phonegapAndroid: {
					files: [
						{src: publicPathRelativeDot+'index.html', dest: publicPathRelativeDot+pathsPhonegap.android+'/index.html'},
						{src: publicPathRelativeDot+'build/main.css', dest: publicPathRelativeDot+pathsPhonegap.android+'/build/main.css'},
						{src: publicPathRelativeDot+'build/main.js', dest: publicPathRelativeDot+pathsPhonegap.android+'/build/main.js'},		//for development only
						{src: publicPathRelativeDot+'build/main-min.js', dest: publicPathRelativeDot+pathsPhonegap.android+'/build/main-min.js'},
						{src: publicPathRelativeDot+'build/templates.js', dest: publicPathRelativeDot+pathsPhonegap.android+'/build/templates.js'},
						{expand: true, cwd: publicPathRelativeDot+'common/font/', src: ['**'], dest: publicPathRelativeDot+pathsPhonegap.android+'/common/font/'},		//apparently it copies the folder(s) in the src path to the dest as well..
						{expand: true, cwd: publicPathRelativeDot+'common/img/', src: ['**'], dest: publicPathRelativeDot+pathsPhonegap.android+'/common/img/'}		//apparently it copies the folder(s) in the src path to the dest as well..
					]
				},
				phonegapIOS: {
					files: [
						{src: publicPathRelativeDot+'index.html', dest: publicPathRelativeDot+pathsPhonegap.ios+'/index.html'},
						{src: publicPathRelativeDot+'build/main.css', dest: publicPathRelativeDot+pathsPhonegap.ios+'/build/main.css'},
						{src: publicPathRelativeDot+'build/main.js', dest: publicPathRelativeDot+pathsPhonegap.ios+'/build/main.js'},		//for development only
						{src: publicPathRelativeDot+'build/main-min.js', dest: publicPathRelativeDot+pathsPhonegap.ios+'/build/main-min.js'},
						{src: publicPathRelativeDot+'build/templates.js', dest: publicPathRelativeDot+pathsPhonegap.ios+'/build/templates.js'},
						{expand: true, cwd: publicPathRelativeDot+'common/font/', src: ['**'], dest: publicPathRelativeDot+pathsPhonegap.ios+'/common/font/'},		//apparently it copies the folder(s) in the src path to the dest as well..
						{expand: true, cwd: publicPathRelativeDot+'common/img/', src: ['**'], dest: publicPathRelativeDot+pathsPhonegap.ios+'/common/img/'}		//apparently it copies the folder(s) in the src path to the dest as well..
					]
				}
			},
			fontAwesomeVars: {
				main: {
					<%
					if(optCssPreprocessor =='less') {
						print("variablesLessPath: publicPathRelativeRoot+'bower_components/font-awesome/less/variables.less',");
					}
					else if(optCssPreprocessor =='scss') {
						print("variablesScssPath: publicPathRelativeRoot+'bower_components/font-awesome/scss/_variables.scss',");
					}
					%>
					fontPath: '../bower_components/font-awesome/fonts'		//NOTE: this must be relative to FINAL, compiled .css file - NOT the variables.less/.scss file! For example, this would be the correct path if the compiled css file is main.css which is in 'src/build' and the font awesome font is in 'src/bower_components/font-awesome/fonts' - since to get from main.css to the fonts directory, you first go back a directory then go into bower_components > font-awesome > fonts.
				}
			},
			exit: {
				normal: {
				}
			},
			devUpdate: {
				//apparently can only check production dependencies OR dev dependencies but not both at once; so need to 2 tasks
				prod: {
					options: {
						packages: {
							devDependencies: false,
							dependencies: true
						}
					}
				},
				dev: {
					options: {
						packages: {
							devDependencies: true,
							dependencies: false
						}
					}
				}
			}
		});



		/**
		register/define grunt tasks
		@toc 6.
		*/

		/**
		@toc 6.1.
		@method outputCoverage
		*/
		grunt.registerTask('outputCoverage', 'display coverage thresholds', function() {
		// var outputCoverageThresholds =function(params) {
			var xx;
			var backend =testCov.jasmine_node;
			var frontend =testCov.angular_karma;
			var msg ='TEST COVERAGE Thresholds:\n';
			msg+='Backend (Node API/Integration Tests):\n';
			for(xx in backend) {
				if(xx !=='failTask') {
					msg+=xx+': '+backend[xx]+' ';
				}
			}
			msg+='\n';
			msg+='Frontend (Angular Karma Unit Tests):\n';
			for(xx in frontend) {
				msg+=xx+': '+frontend[xx]+' ';
			}
			msg+='\n';
			grunt.log.subhead(msg);
		});


		var seleniumType ='local';
		if(cfgTestJson.sauceLabs.user && cfgTestJson.sauceLabs.key) {
			seleniumType ='sauce';
		}
		else if(cfgTestJson.browserstack && cfgTestJson.browserstack.user && cfgTestJson.browserstack.access_key) {
			seleniumType ='browserstack';
		}

		var tasks =[];
		var tasksSelenium =[];

		tasks =[];
		// tasks =['http:nodeShutdown'];		//need to run node server from jasmine test to get coverage.. BUT do this just in case (won't hurt / just in case node test server was running from dev/watch task) - UPDATE: this will be shut down by test-backend task
		//only do selenium if NOT using sauce labs
		if(seleniumType =='local') {
			tasks.push('http:seleniumShutdown');
			tasksSelenium.push('http:seleniumShutdown');
		}
		grunt.registerTask('test-cleanup', tasks);

		// grunt.registerTask('test-server', ['parallel:testServer']);

		tasks =[];
		// tasks =['shell:nodeServer'];		//need to run node server from jasmine test to get coverage..
		//only do selenium if NOT using sauce labs
		if(seleniumType =='local') {
			tasks.push('shell:seleniumStartup');
			tasksSelenium.push('shell:seleniumStartup');
		}
		grunt.registerTask('test-setup', tasks);

		grunt.registerTask('selenium-server', tasksSelenium);

		grunt.registerTask('node-test-server', ['http:nodeShutdown', 'shell:nodeServer']);

		grunt.registerTask('test-backend', ['http:nodeShutdown', 'jasmine_node']);

		//faster / dev test task
		grunt.registerTask('test-backend-dev', 'run backend tests', function() {
			process.argv.push('runjs=no');		//add command line argument to NOT require / run run.js
			grunt.task.run(['jasmine_node']);
		});

		//need to exit otherwise coverage report doesn't display on the console..
		grunt.registerTask('node-cov', ['test-backend', 'exit']);

		var tasksE2eIso =['shell:protractor'];		//default
		if(cfgTestJson.e2e !==undefined && cfgTestJson.e2e.run_type !==undefined) {
			if(cfgTestJson.e2e.run_type =='none') {
				tasksE2eIso =[];
			}
			else if(cfgTestJson.e2e.run_type =='parallel') {
				tasksE2eIso =['parallel:protractor'];
			}
		}

		//shorthand for 'shell:protractor' (this assumes node & selenium servers are already running so will NOT work by itself)
		grunt.registerTask('e2e-iso', tasksE2eIso);

		//standalone task - starts & stops selenium AND node servers before/after
		grunt.registerTask('e2e', ['test-cleanup', 'node-test-server', 'test-setup', 'shell:protractor', 'test-cleanup', 'http:nodeShutdown']);

		grunt.registerTask('karma-cov', ['clean', 'karma:unit', 'coverage']);

		//can NOT be run by itself as it will fail/error without selenium AND node servers started/stopped before/after
		grunt.registerTask('test-frontend-iso', ['karma-cov', 'e2e-iso']);

		//standalone task - starts & stops selenium AND node servers before/after
		grunt.registerTask('test-frontend', ['test-cleanup', 'node-test-server', 'test-setup', 'karma-cov', 'e2e-iso', 'test-cleanup', 'http:nodeShutdown']);

		grunt.registerTask('test', 'run all tests', function() {
			// grunt.task.run(['test-backend', 'test-frontend-iso']);
			grunt.task.run(['test-cleanup', 'test-setup', 'test-backend', 'test-frontend-iso', 'test-cleanup']);
		});

		//don't get "done, without errors" grunt completion with 'exit' task and this causes CI to not complete.. Also linux sometimes?? outputs the coverage even without 'exit'?
		grunt.registerTask('test-cov', ['test', 'exit']);		//need to exit on this task to ensure backend coverage shows up and fails if below (otherwise it won't!!) - NOTE: this means that if this task is called (i.e. with 'default' task), it must be LAST since it will force exit after it's done!

		grunt.registerTask('yui', ['yuidoc']);

		grunt.registerTask('lint-backend', ['jshint:backend']);

		grunt.registerTask('build', ['clean', 'buildfiles', 'ngtemplates:main', 'fontAwesomeVars',
			<%
			if(optCssPreprocessor =='less') {
				print("'less:dev',");
			}
			else if(optCssPreprocessor =='scss') {
				print("'compass:dev',");
			}
			%>
			'jshint:backend', 'jshint:beforeconcat', 'uglify:build',
			'concat:devCss', 'cssmin:dev', 'concat:devJs']);		//don't really need BOTH concat css and cssmin css..

		// Default task(s).
		grunt.registerTask('default', 'run default task', function() {
			//check to ensure config files and npm install are up to date
			var cfgVersion = (cfgJson.versions) ? cfgJson.versions.cfg : undefined;
			var pkgVersion = (cfgJson.versions) ? cfgJson.versions.pkg : undefined;
			var validVersion = true;

			if(cfgJson.versions.cfg !== curVersions.cfg) {
				grunt.log
					.error('ERROR config.json version mismatch: expected "%s", found "%s"', curVersions.cfg, cfgVersion)
					.subhead('please update config.json, then re-run\n');
				validVersion = false;
			}

			if(cfgJson.versions.pkg !== curVersions.pkg) {
				grunt.log
					.error('ERROR package.json version mismatch: expected "%s", found "%s"', curVersions.pkg, pkgVersion)
					.subhead('run npm install, update config.json, then re-run\n');
				validVersion = false;
			}

			if(validVersion) {
				var tasks =['outputCoverage', 'build', 'test'];
				//see if we want to run forever or not
				if(cfgJson.forever !==undefined && cfgJson.forever) {
					// tasks =['build', 'foreverMulti', 'wait:afterForever', 'test'];		//need to wait after restart server to give a chance to initialize before the tests are attempted (otherwise will just error and fail because the server isn't up/restarted yet)
					tasks =['build', 'foreverMulti', 'test'];		//do NOT need to wait anymore now that moved test server to be started by test task itself!		//do NOT run 'devUpdate' on production as this seems to break ci? plus it's not really necessary there anyway? or maybe fix this?
				}
				tasks.push('outputCoverage');
				//if NOT on production (since this seems to break CI?), check for dependencies LAST (since not failing task, just want to make them visible)
				if(cfgJson.forever ===undefined || !cfgJson.forever) {
					tasks.push('devUpdate');
				}
				//locally ENSURE coverage is enforced (either locally or Windows is NOT running final node coverage)
				// if(cfgJson.server.domain =='localhost') {
				if(1) {		//actually it's even a problem on linux servers??
					tasks.push('exit');
				}
				grunt.task.run(tasks);
			} else {
				throw new Error('invalid project versions.');
			}
		});

		//quick version of default task testing/viewing quick changes
		grunt.registerTask('q', ['clean', 'buildfiles', 'ngtemplates:main', 'fontAwesomeVars',
			<%
			if(optCssPreprocessor =='less') {
				print("'less:dev',");
			}
			else if(optCssPreprocessor =='scss') {
				print("'compass:dev',");
			}
			%>
			'jshint:backendQ', 'jshint:beforeconcatQ', 'uglify:build',
			'concat:devCss', 'cssmin:dev', 'concat:devJs']);

		grunt.registerTask('q-watch', ['buildfiles', 'ngtemplates:main',
			<%
			if(optCssPreprocessor =='less') {
				print("'less:dev',");
			}
			else if(optCssPreprocessor =='scss') {
				print("'compass:dev',");
			}
			%>
			'jshint:backendQ', 'jshint:beforeconcatQ'
		]);

		//Phonegap build
		grunt.registerTask('phonegap', 'run Phonegap task', function() {
			grunt.option('config', 'phonegap');
			grunt.option('type', 'prod');
			init({});		//re-init (since changed grunt options)

			grunt.task.run(['clean', 'buildfiles', 'ngtemplates:main', 'fontAwesomeVars',
				<%
				if(optCssPreprocessor =='less') {
					print("'less:dev',");
				}
				else if(optCssPreprocessor =='scss') {
					print("'compass:dev',");
				}
				%>
				'uglify:build',
				'concat:devCss', 'cssmin:dev', 'concat:devJs', 'copy:phonegapAndroid', 'copy:phonegapIOS']);
		});

		grunt.registerTask('noMin', ['clean', 'buildfiles', 'ngtemplates:main', 'fontAwesomeVars',
			<%
			if(optCssPreprocessor =='less') {
				print("'less:dev',");
			}
			else if(optCssPreprocessor =='scss') {
				print("'compass:dev',");
			}
			%>
			'concat:devJsNoMin', 'concat:devCss']);

		//sauce labs tests
		grunt.registerTask('sauce', ['parallel:sauce']);

		/**
		Short version: Starts test servers then auto-runs 1. `grunt q` and 2. karma unit tests on file changes (so you do not have to manually run these commands all the time)
		Long version:
		This is the main / most commonly run grunt task for development - it does some setup then watches for changes and runs things (tests, build) accordingly. Specifically:
		- start test servers (node, selenium, karma) running
			- FIRST clean up / stop any existing test servers (prevent errors when trying to re-run)
		- watch for file changes and build (if html/less/scss files changes) or test (if js file changes) accordingly
			- tests to run and when to run them:
				- karma frontend unit if one of the unit buildfiles files changes
				- protractor frontend e2e (selenium) if one of the e2e buildfiles files changes - NOT CURRENTLY run / watched as these tests take awhile (more than a few seconds); just run manually with `grunt e2e`
				- jasmine backend - NOT CURRENTLY run / watched; requires node server restart so probably not worth it/the time; just run manually with `grunt test-backend` in a separate command window
		//grunt.task.run(['test-cleanup', 'test-setup', 'test-backend', 'test-frontend-iso', 'test-cleanup']);
		*/
		//test only
		// grunt.registerTask('dev-test', ['q-watch', 'test-cleanup', 'test-setup', 'karma:watch:start', 'watch:karmaUnitJs', 'watch:karmaUnitTest']);		//doesn't work - watch isn't a multi-task..
		grunt.registerTask('dev-test', ['q-watch', 'test-cleanup', 'test-setup', 'karma:watch:start', 'focus:test']);

		// grunt.registerTask('dev-karma-cov', ['q-watch', 'karma:watchCov:start', 'focus:testKarmaCov']);		//does not work.. get 'app/src/coverage-angular' does not exist..
		grunt.registerTask('dev-karma-cov', ['q-watch', 'focus:testKarmaCov']);

		//build only
		// grunt.registerTask('dev-build', ['q-watch', 'watch:buildfiles', 'watch:html', 'watch:less', 'watch:jsHintFrontend', 'watch:jsHintBackend']);		//doesn't work - watch isn't a multi-task..		//@todo - if do change this, make sure to add scss version!!
		grunt.registerTask('dev-build', ['q-watch', 'focus:build']);

		//all (build & test)
		grunt.registerTask('dev', ['test-cleanup', 'test-setup', 'q-watch', 'karma:watch:start', 'focus:all']);

	}

	init({});		//initialize here for defaults (init may be called again later within a task)

};
