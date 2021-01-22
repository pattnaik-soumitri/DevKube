# **Dev<span style='color: #3169DF;'>Kube</span>**

**Q.** What DevKube **<span style='color: green;'>is</span>**?<br/>
 > It runs `kubectl` commands for you.

DevKube is a developer focused cross platform `kubectl` GUI. 
It helps developers and testers by providing a simple yet function interface to perform some of the most frequently used kubectl operations by just click of a button, which in many cases are done by entering long and cumbersome kubectl commands. DevKube helps the team become more productive by **saving time** and removing **human error**.

<br/>

**Q.** What DevKube is **<span style='color: red;'>not</span>**?<br/>
It is not a one stop solution for all things kubectl / Kubernetes. Teams will still need to write kubectl commands for operations which are not available in DevKube.


<br/>

## Prerequisites
- DevKube runs on top of `kubectl`, so it is required to setup and configure kubectl before using DevKube.

<br/>

## Setup

### Step 1
Download and install NodeJS from https://nodejs.org/en/download/ .

<br/>

### Step 2

```sh
git clone https://github.com/pattnaik-soumitri/DevKube
```

<br/>

### Step 3
```sh
npm install
```

<br/>

## Run
```sh
npm start
```

<br/>

## Features
- View and perform operations on K8S resources such as `pod`, `service`, `deployment`, `replicaset`, `statefulset`.
- Switch `context`.
- Switch `namespace`.

- **Common features**
  - View resources [*namespaced*]
  - Describe resource `kubectl describe`
  - Delete resource `kubectl delete`

- **Pod features**
  - View container logs `kubectl logs`
  - Log into pod `kubectl exec`
  - View deployment yaml file.

- **Service features**
  - Portforward to service `kubectl portforward`

<br/>
