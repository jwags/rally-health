# rally-health

A tool for checking health of scrum teams.

## Development

We're changing over to the grunt/node approach with this one.  You'll need to do the following to set up:

We use grunt as a combiner/builder/test_runner.  The advantage of a building system is that we can divide the 
product into 
separate files (JS, CSS) that are combined into a single HTML file that gets put into the panel in Rally.
(Apps live inside iframes, so they are basically html files with JS.)  Also, we can create a debug version that 
doesn't have to be copied in on every change while developing.

To develop, you'll need to set up an environment, following these steps:

1.  **Install git**  We use github as our version control system.  Follow the instructions on github.

2.  **Install node.js**  This really is as simple as going to http://nodejs.org/ and pushing the Install button.  Afterward, type 
this command to see that it installed:

        npm --version

3.  **Install grunt**
From the command line, use the node package manager to install grunt.  On linux/mac, you might have to use 
sudo as shown below. On Windows, you will not use the sudo part of the command.

        sudo npm install -g grunt-cli
        sudo npm install -g grunt-init

4. **Locally Configure grunt**  Change directories to the root of this project and locally install grunt to connect it to the project.
    
        npm install grunt

5. **Additional dependencies**  Locally install additional dependencies: grunt-templater, and underscore:

        npm install grunt-templater
        npm install underscore
        npm install grunt-contrib-jasmine --save-dev
        

### Developing

### Grunt
To run a task, type `grunt <task name>`.  For example:
`grunt debug`

The default task will run if you don't provide a task name.

*default* Creates a version of the html file (in the deploy directory) that must be cut and pasted into the App panel in Rally.
*debug* Creates a version of the html file (at project root) that can be loaded into a browser and refreshed to test whenever you change the JS files.  (You still have to log into Rally in another browser tab.)

#### config.json
This file provides a few configuration settings for the app you are creating.  Change the server and sdk settings when developing against a different sdk or testing on another server.  The 
javascript and css settings are no longer required -- they're historical -- because the gruntfile just pulls the list of JS files from the src directory.

#### auth.json
If you are going to run the slow tests, you must also create an authorization configuration file.  This file contains the username and password of a Rally user that you want to use for the tests to
log into Rally and read/create data.  **NOTE:** When the grunt test-slow task runs, it will copy these values into the _SpecRunner.html file.  Do not commit or provide the auth.json and _SpecRunner.html 
files to anyone else.  The file should look like this:
        {
            "username": "somebody@somewhere.com",
            "password": "secret!"
        }


### Testing
We used jasmine for rspec-style testing.  To ease transfer, we are not truly unitizing the tests.  The tests will all require 
that you can connect to the Rally server so that we can use Rally-supplied JS.  The "fast" tests are generally created to not
need another connection to Rally beyond that grabbing of the SDK.  If a test interacts with Rally _data_, it should be a part of
the "slow" tests.

Type grunt test-fast to run the fast tests.  

Type grunt test-slow to run the slow tests.  There will be an error message reported about null on getUser, but this can be ignored.  The 
important part of the output looks like this:


        ..
        2 specs in 1.359s.
        >> 0 failures

with a dot for every test.  

After either test-fast or test-slow is run, a Jasmine spec runner (_SpecRunner.html) is left in the root directory.  You
can open it in a browser to see those tests run in traditional manual manner (and to check the console for interesting
output when tests fail).  You can also run the tests with -v to get more verbose output.  The verbose output includes 
any outputs to console.log.  (grunt -v test-fast)
