(function() {

    var flag;

    var showFlag = function() {
        var el = document.createElement('div');
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
        document.body.appendChild(el);
        flag = el;
    }

    var check = function() {
        if (typeof YUITest === 'undefined') {
            setTimeout(check, 100);
            return;
        }
        init();
    };

    var init = function() {
        YUITest.TestRunner.on(YUITest.TestRunner.COMPLETE_EVENT, function(results) {
            showFlag();
            var results = YUITest.TestRunner.getCoverage(YUITest.CoverageFormat.JSON);
            YUI().use('test', 'json-parse', function(Y) {
                var reporter = new Y.Test.Reporter('/results/', YUITest.TestFormat.JSON);
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
        location.href = '/results/';
    });

}());
