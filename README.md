# **Dev<span style='color: #3169DF;'>Kube</span>**

**Q.** What DevKube **<span style='color: green;'>is</span>**?<br/>
 > It runs `kubectl` commands for you.

DevKube is a developer focused cross platform (Linux support is coming soon) `kubectl` GUI. 
It helps developers and testers by providing a simple yet functional interface to perform some of the most frequently used kubectl operations by just click of a button, which in many cases are done by entering long and cumbersome kubectl commands. DevKube helps the team become **more productive** by **saving time** and removing **human error**.

<br/>

**Q.** What DevKube is **<span style='color: red;'>not</span>**?<br/>
It is not a one stop solution for all things kubectl / Kubernetes. Teams will still need to write kubectl commands for operations which are not available in DevKube.


<br/>

## Prerequisites

- DevKube runs on top of `kubectl`, so it is required to [setup and configure](https://kubernetes.io/docs/tasks/tools/install-kubectl/) kubectl before using DevKube.

<br/>

## Installation

1. Download and install [Node.js](https://nodejs.org/en/download/).
2. Clone DevKube repo
3. Install node dependencies

```sh
$ git clone https://github.com/pattnaik-soumitri/DevKube
$ cd DevKube
$ npm install
```

## Run DevKube

```sh
$ npm start
```

## Update DevKube

- As of now the application does not have a installer or auto-update functionality. However the functionalities are in the pipeline to be worked upon. The source code is directly run to use the application as of now.
- So for now, new features/enhancements/bugfixes etc, will be pushed to the `main` branch (the default branch after `git clone`). So it is advisable to **run `git pull` few times a week** to be able to get the stay on the bleeding edge of the software.

<br/>

## Features

- View and perform operations on K8S resources such as `pod`, `service`, `deployment`, `replicaset`, `statefulset`, `daemonset`, `job`, `cronjob`.
- Switch `cluster`/`context`.
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
