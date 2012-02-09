YUI Code Coverage Helper
========================

This little CLI tool will aid YUI developers with their code coverage for the library.

Install
-------

    npm -g i yui-coverage 


Usage
-----

    cd yui3/src/dd
    yui-coverage

Then open a browser to: http://127.0.0.1:3000/

This will load the tests from: `src/dd/tests/index.html`

On the fly, it will run YUITest's test coverage tool on the files as they are loaded
in the browser. Then when it's complete it will display the Code Coverage results.

**Note:** It will only run coverage on a module that belongs to the directory
it's currently serving from. In the above example, it will only encode `dd` modules.
This way you get code coverage for your individual module and not all of the modules in
the system.


You could even check out the coverage that this module covers of another module:

    cd yui3/src/dd
    yui-coverage -m yui,dd,base

This will cover all of the `yui,dd` and `base` modules too. So you can see how much code from
those modules are actually being tested.

For example, with the `dd` module you might see that you have 100% test coverage for `dd`.
But when you add `base` or `event` to the mix you might only be using _50%_ of those modules.
That gives you a good idea on maybe using less modules if they are not needed.

