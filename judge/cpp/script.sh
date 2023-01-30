#!/bin/bash

cd volumes

n=${1}
time=${2}
mem=${3}

g++ -o code main.cpp 2>errors.txt

if [ $? -ne 0 ];
then
    echo -n "ce" >verdict.txt
    exit 0
fi

for (( tc=1 ; tc<=${n} ; tc++ ));
do
    ./code <./testcases/in${tc}.in &>./testcases/out${tc}.out

    if [ $? -ne 0 ];
    then
        echo -n "re" >verdict.txt
        exit 0
    fi

    readarray -t expected_output <./testcases/eout${tc}.out
    readarray -t actual_ouput <./testcases/out${tc}.out

    if [ ${#actual_ouput[@]} -ne ${#expected_output[@]} ];
    then
        echo -n "${tc}" >verdict.txt
        exit 0
    fi

    for i in "${expected_output[@]}";
    do
        if [ "${expected_output[$i]}" != "${actual_ouput[$i]}" ];
        then
            echo -n "${tc}" >verdict.txt
            exit 0
        fi
    done
done

echo -n "ac" >verdict.txt