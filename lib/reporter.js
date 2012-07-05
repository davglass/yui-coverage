(function() {
    
    var win = window;
    if (window !== top) {
        win = top;
    }
    var flag;

    var showFlag = function() {
        var el = win.document.createElement('div');
        var st = el.style;
        st.border = '1px solid black';
        st.backgroundColor = 'green';
        st.color = 'white';
        st.padding = '3em';
        st.position = 'absolute';
        st.top = '300px';
        st.left = '300px';
        st.width = '500px';
        el.innerHTML = 'Please wait while a coverage report is generated for this test suite.';
        win.document.body.appendChild(el);
        flag = el;
    }

    var check = function() {
        if (typeof win.YUITest === 'undefined') {
            setTimeout(check, 100);
            return;
        }
        init();
    };

    var init = function() {
        win.YUITest.TestRunner.on('complete', function(results) {
            showFlag();
            var results = win.YUITest.TestRunner.getCoverage(win.YUITest.CoverageFormat.JSON);
            win.YUI().use('test', 'json-parse', function(Y) {
                var reporter = new Y.Test.Reporter('/results/', Y.Test.Format.JSON);
                try {
                    var res = Y.JSON.parse(results);
                    reporter.report(res);
                } catch (e) {
                    flag.innerHTML = 'Failed to parse the JSON results from YUITest!!';
                    console.error(e);
                }
            });
        });
    };

    window.onload = function() {
        check();
    };

    var socket = io.connect('/');
    socket.on('done', function (data) {
        win.location.href = '/results/';
    });

}());
