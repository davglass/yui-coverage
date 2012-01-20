YUI Code Coverage Helper
------------------------

This little CLI tool will aid YUI developers with their code coverage for the library.

Install
=======

    npm -g i https://github.com/davglass/yui-coverage


Usage
=====

    cd yui3/src/dd
    yui-coverage


Then open a browser to: http://127.0.0.1:3000/

This will load the tests from: `src/dd/tests/index.html`

On the fly, it will run YUITest's test coverage tool on the files as they are loaded
in the browser. Then when it's complete it will display the Code Coverage results.
