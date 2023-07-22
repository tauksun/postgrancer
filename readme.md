## Postgrancer

Postgrancer acts as a middleware between your Application Code & Postgres Database Servers.

Enabling connection pooling, query loading balancing between Primary & Replicas by identifying read & write queries, and database monitoring with promoting Replica in case of Primary Database failure.

## Running on local 
> Postgrancer repo has node_modules folder which contain pre-built binaries for x_86 architecture (linux) for libpg-query library.

> Running on x_86 architecture : 
```
    1. git clone https://github.com/tauksun/postgrancer
    2. cd ./postgrancer
    3. npm run dev
```

> To run on arm64 architecture (linux) : Download executable for 
     [arm64 architecture (linux)](https://postgrancer.com/)
      - or - Checkout below steps to build Without pre-built binaries


## Build Executable 

### With pre-built binaries(x_86 architecture)


1. Clone repo :
```
    git clone https://github.com/tauksun/postgrancer
 ```
 
2. Compile Typescript Files : 
```
    cd ./postgrancer
    ./node_modules/typescript/bin/tsc
```    
3. Install "pkg" to build executable : 
```
    cd ./dist
    cp -r ../node_modules .
    cp ../package.json .
    npm i -g pkg
    pkg .
    
```

### Without pre-built binaries(x_86/arm64)


1. Clone repo :
```
    git clone https://github.com/tauksun/postgrancer
 ```
 
 2. Install build tools : 
 ```
    # Ubuntu : 
    
    sudo apt update
    sudo apt install make
    sudo apt install build-essential -y 
    
    
    # Fedora : 
    dnf install make
    dnf install @development-tools
    
    (For others : Use distribution specific package manager)
    
 ```
 
3. Install packages : 
```
    cd ./postgrancer
    rm -r node_modules
    npm install 
```
 
4. Compile Typescript Files : 
```
    ./node_modules/typescript/bin/tsc
```    

5. Install "pkg" to build executable : 
```
    cd ./dist
    cp -r ../node_modules .
    cp ../package.json .
    npm i -g pkg
    pkg .
    
```
