define(function() {
    var textArea = document.getElementById('statusBox');

    function printLn(str) {
        console.log((Array.prototype.slice.call(arguments)).toString());
        textArea.value += str + "\n";

        // Scroll to bottom
        textArea.scrollTop = textArea.scrollHeight;
    }

    printLn("Welcome to Zombies of the ASCII world!");
    printLn("");
    printLn("Eliminate as many zombies as you can!");
    printLn("Numpad to move, space bar to skip a turn.");
    printLn("");

    return {
        printLn: printLn
    };
});
