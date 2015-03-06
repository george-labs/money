# money

MONEY Web Application | __“MONEY – Your Financial Health Check”__

The _MONEY Web Application_ — henceforth referred to as _MONEY_ — is a financial assessment tool created by [BeeOne](http://www.beeone.at/) in Vienna, Austria for a core group of the European members of WSBI (World Savings and Retail Banking Institute) and ESBG (European Savings and Retail Banking Group).

The tool is simply a web application that strives to make participants think about their relationship with money and financial matters in an entertaining way.


## Preparation

MONEY can be hosted on a Linux or Windows server. There are no actual minimum requirements, but as a recommendation: 1.6GHz CPU, 1.75GB RAM, 10GB Storage. These minimum requirements would only apply if the machine would be set up and used solely for MONEY. However, it is more likely that the database will be installed on existing hardware. Therefore the components listed as follows will only be needed if not already present.

Alternatively, if you choose not to host MONEY on your own hardware, but instead delegate the hosting to a service provider, you need to make sure you choose a provider that offers the required components; in particular `MongoDB` and `nodejs` – [https://github.com/joyent/node/wiki/Node-Hosting](https://github.com/joyent/node/wiki/Node-Hosting).

### Preparing the infrastructure

* `MongoDB` ([http://www.mongodb.org/](http://www.mongodb.org/)) will be used for storing data:
  [http://docs.mongodb.org/manual/installation/](http://docs.mongodb.org/manual/installation/)
* `nodejs` ([http://nodejs.org/](http://nodejs.org/)) will be used to run MONEY:
  [http://nodejs.org/download/](http://nodejs.org/download/)
* `npmjs` ([https://npmjs.org/](https://npmjs.org/)) will be needed to ensure that all additionally required software packages can be retrieved. `npmjs` should be already installed once you have `nodejs` installed.

Given that the installation process will be different as it depends on the operating system you have on your server, please install the infrastructure components by following the referenced guides.

In case you choose to provide MONEY over a secure connection (recommended), you need to obtain an SSL certificate.

With these components (and the certificate) on your operating system you should be able to get MONEY running. In addition, a web server (Apache2, nginx, or similar) is needed to make MONEY available to the outside world. In general, MONEY should be made available on a dedicated subdomain, e.g. https://money.example.com/.


## Installing the software

Before you proceed, make sure that the infrastructure components from the previous chapter are up and running, to avoid having to deal with a problem that originates from those components and has little or nothing to do with the installation of MONEY itself.

The following instructions target *nix environments, but they apply to Windows in a similar fashion. You have to take into account that many of the referenced command line tools (e.g. `git`) are already installed on Linux, whereas on a Windows server they need to be installed manually.

### Downloading the source code

Choose a location on your server’s hard disk where you would like to store the MONEY source code, and switch into this directory.

```bash
cd /path/to/money
```

You could now download the source by following the link below and download a ZIP file, but we recommend doing it by simply cloning the github repository.

```bash
git clone https://github.com/BeeOneGmbH/money .
```

Notice the extra space and dot at the end. If you omit it, a directory named `money` will be created for you within your current directory, which will then contain the source code.

After successful download, your directory contains – among other things – a file named `package.json`, where additionally required plugins are listed. You’ll install them using the node package manager.

```bash
npm install
```

Once the node package manager has successfully downloaded the plugins, you’re done.


## Configuring the software

The steps described in this chapter are intended to enable administrators to fine-tune the installation.

In your MONEY home directory you could create a file named `settings.json`, which would allow you to override the default behavior of MONEY. A simple version could look like this.

```json
{
  "id": "example.com",
  "country": "AT",
  "centralDatabase": {
    "host": "money.savings-banks.com",
    "port": 443
  }
}
```

Whatever the content might be, it has to be a valid JSON file ([http://jsonlint.com/](http://jsonlint.com/)). Content similar to the one shown above would provide the minimum settings to get MONEY running. In case you decide to override all possible options, the file’s content could look like as follows.

```json
{
  "id": "money.beeone.at",
  "instance": "EN",
  "country": "AT",
  "port": 1234,
  "database": {
    "host": "127.0.0.1",
    "port": 27017
  },
  "centralDatabase": {
    "host": "money.savings-banks.com",
    "port": 443
  },
  "users": [
    { "name": "JohnDoe", "role": "editor", "password": "changeafter1stlogin" },
    { "name": "JaneDoe", "role": "chiefeditor", "password": "changeafter1stlogin" }
  ]
}
```

The `id` should contain a _unique qualifier_ that identifies your installation of MONEY and distinguishes it from all the other ones out there. Therefore we recommend specifying your URL.

The `instance` identifier allows you to separate multiple instances of MONEY so you can have more than one installation sharing the same database. This is useful if you plan to provide the MONEY application in more than one language, e.g. https://money-en.example.com/ and https://money-fr.example.com/.

The `country` code is required because the MONEY Centralized Database (see below) will affiliate your installation to a specific country.

The `port` allows you to define a specific port for the MONEY application itself. Unless specified otherwise, the default port is 8080.

In case your installation of `MongoDB` has not been set up with default parameters, or if the database it is even installed on a different server than MONEY itself, you might want to specify a `database` entry – containing a host name and a port number – which MONEY should use to connect to the database. The values shown above are the aforementioned defaults for both `MongoDB` and MONEY. So unless specified otherwise, MONEY uses 127.0.0.1:27017 when trying to connect to `MongoDB`.

The `centralDatabase` let's you define the connection information to the [MONEY Centralized Database](https://github.com/BeeOneGmbH/money-central) and this should be provided exactly as shown above, because there are no defaults to fall back to.

Any number of `users` can be specified to enable them to work with the MONEY CMS (Content Management System), but you only need two as there are two different roles (editor and chiefeditor) in the CMS. Refer to the CMS documentation for more details.


## Running the software

If you are in your MONEY home directory, you could now run it for testing purposes.

```bash
node money.js
```

If you do not get an error message, you’ll end up with some output lines, the final one should start with “Express server listening…” – this means that so far everything has been installed and configured correctly.

It is recommended to use `forever` ([https://github.com/nodejitsu/forever#readme](https://github.com/nodejitsu/forever#readme)) to keep the MONEY up and running, which can be installed via node package manager.

```bash
sudo npm install -g forever
```

However, `forever` only restarts MONEY after something unexpected happens within the application. In order to restart it even after your server has been restarted, you need to add the following to one of your start scripts or to the server’s crontab as a `@reboot` entry, or similar.

```bash
forever start --minUptime 10000 -a -l /path/to/money/logs/forever.log -o /path/to/money/logs/out.log -e /path/to/money/logs/err.log /path/to/money/money.js
```

This is also the recommended way you want to start MONEY. You might want to put this in a shell script. Once started like this, you could perform a check, to see if the installation is responding.

```bash
curl -v http://localhost:your-port-number/
```

This should deliver the HTTP status code 200 OK.
