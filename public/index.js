$(document).ready(()=>{
    let curPath = $(location).attr("pathname");
    let links = $(".nav-link");
    let curActive;
    
    for (let i=0; i<links.length; i++){
        let link = $(links[i]).attr("href");
        if (curPath === link){
            curActive = links[i];
            break;
        }
    }
    
    $(".nav-link").removeClass("active");
    $(curActive).addClass("active");
});


$(document).ready(()=>{
    $(".sample-title button").click(function (e){
        let preId = $(this).data("copy-target");

        let preDoc = $(preId)[0];
        navigator.clipboard.writeText(preDoc.innerText);
    });
});


$(document).ready(()=>{
    let cEdit = true;
    let cppEdit = true;
    let javaEdit = true;
    let pythonEdit = true;
    let cppMode = "text/x-c++src";
    let cMode = "text/x-csrc";
    let javaMode = "text/x-java";
    let pythonMode = "text/x-python";

    let cppValue = `#include <bits/stdc++.h>
using namespace std;

int main(){
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Starting of your code

    

    // Ending of your code

    return 0;
}`;

    let javaValue = `import java.lang.*;
import java.util.*
import java.io.*;

class CodeQuake{
    public static void main(String[] args) throws java.lang.Exception{
        // Starting of your code

        

        // Ending of your code
    }
}`;

    let pythonValue = `# Your code goes here
`;

    let cValue = `#include <stdio.h>

int main(){
    // Starting of your code

    

    // Ending of your code

    return 0;
}`;

    let editor = CodeMirror($("#editor")[0], {
        value: cppValue,
        mode: cppMode,
        lineNumbers: true,
        indentUnit: 4,
        theme: "monokai"
    });
    
    $("#editor").click((e)=>{
        let val = $("#langSelect").val();
        editor.focus();

        switch (val){
            case "cpp":
                if (cppEdit){
                    editor.setCursor({line: 9});
                    cppEdit = false;
                    cEdit = pythonEdit = javaEdit = true;
                }
                break;
            case "c":
                if (cEdit){
                    editor.setCursor({line: 5});
                    cEdit = false;
                    cppEdit = pythonEdit = javaEdit = true;
                }
                break;
            case "java":
                if (javaEdit){
                    editor.setCursor({line: 8});
                    javaEdit = false;
                    cEdit = pythonEdit = cppEdit = true;
                }
                break;
            case "py":
                if (pythonEdit){
                    editor.setCursor({line: 1});
                    pythonEdit = false;
                    cEdit = cppEdit = javaEdit = true;
                }
                break;
        }
    });

    $("#langSelect").change(function (e){
        let val = $(this).val();
        
        switch (val){
            case "cpp":
                editor.setOption("mode", cppMode);
                editor.setOption("value", cppValue);
                break;
            case "c":
                editor.setOption("mode", cMode);
                editor.setOption("value", cValue);
                break;
            case "java":
                editor.setOption("mode", javaMode);
                editor.setOption("value", javaValue);
                break;
            case "py":
                editor.setOption("mode", pythonMode);
                editor.setOption("value", pythonValue);
                break;
        }
    });

    $("#code-form").submit((e)=>{
        let val = editor.getValue();
        $("#code-form input[name='code']").val(val);
    });
});


$(document).ready(()=>{

    const search = window.location.search;
    const params = new URLSearchParams(search);
    const subId = params.get("subId");
    // const subId = null;
    if (subId!=null && subId!=undefined){
        let problemSocket = io.connect("http://localhost:3000/submission", {query: {subId: subId}, forceNew: true});

        problemSocket.on("message", (message)=>{
            $("#status").text(message);

            if (message !== "Running...")
                problemSocket.disconnect();
        });
    }
});

$(document).ready(()=>{

    const contestPath = $(location).attr("pathname");
    const contestPathArray = contestPath.split("/");    
    
    if (contestPathArray[1]==="contest" && contestPathArray[2]){
        let contestSocket = io.connect(`http://localhost:3000/contest`);
        contestSocket.emit("join", contestPathArray[2]);
        console.log("here");

        contestSocket.on("message", (message)=>{
            console.log(message);

            // if (message !== "Running...")
            //     contestSocket.disconnect();
        });
    }


});