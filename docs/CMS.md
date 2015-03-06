# money CMS

MONEY Content Management System | __“MONEY – Your Financial Health Check”__

The _MONEY Content Management System_ — henceforth referred to as _CMS_ — is a WYSI(almost)WYG editor within the MONEY application. It is used to

1. administer the (state of the) application itself;
2. modify parts of the content or even translate the whole content to a different language;
3. get statistical information about the application usage.


## Login

After MONEY has been [successfully set up and CMS users have been created](../README.md), these CMS users — each having one of the roles _editor_ or _chiefeditor_ — can log in to the CMS. The CMS is accessible by simply adding `/cms` to the actual application URL.  
Example: https://your-money-app-url.example.com/cms

Although the CMS does not enforce it, CMS users should change their password after their initial log in. The ‘change password’ button can be found on the main screen of the CMS.

The reason for having two roles _editor_ and _chiefeditor_ is simply that not one person can single-handedly change the application behavior, given that a two-man rule is usually required for this kind of application in the financial industry.


## Overview

The CMS features a main menu at the top. It contains the necessary navigational links to all the relevant sections of the application, i.e. the main screen, METADATA, BRANDING, TRANSLATIONS, STATISTICS and LOGOUT.

The first four sections provide a split screen view with an __action bar__ on the right hand side, while STATISTICS is a read-only section that displays statistical information covering the entire screen.


## Features for editors

The sections METADATA, BRANDING and TRANSLATIONS are the places where _editors_  can modify the application content.
The latter two sections include a preview, changes made in the action bar take effect immediately.

Editing is pretty self-explanatory. Just keep in mind that any change in an input field will be saved immediately as soon as you leave the input field (e.g. by pressing the `TAB` key), hence no dedicated ‘save’ button exists.

In TRANSLATIONS, the action bar consists of four panels:

  * ‘Pages’, to switch between the different application screens;
  * ‘Elements’, to switch within the selected screen (although this can also be achieved by directly clicking on an element in the preview area);
  * ‘Translation’, where the actual modifications are made;
  * ‘History’, an additional feature only for _editors_, where the current translation for the selected element can be persisted. You can then easily jump back and forth between previously persisted versions and choose the one that suits you.


## Features for chief editors

_chiefeditors_ cannot make any content modifications in the CMS. Instead they get read-only access to cross-check the changes made by _editors_.

The essential feature for _chiefeditors_ is that only they are able to activate and update the whole application, so they are to choose what given state in the database — crafted by _editors_ — should go online.
For _chiefeditors_ the action bar on the CMS main screen initially contains a ‘Go online’ button, which will activate the application and make it accessible (this holds true if your system administrator has already set up the application in a way that is publicly accessible, and not just behind a firewall, within your local intranet, or similar).

Before being accessible, the application URL itself delivers an HTTP 404 response (unlike the CMS URL which is available at any given time).  
After being accessible, _chiefeditors_ will see both a ‘Go offline’ and an ‘Update’ button.

Further changes made by _editors_ after initially going online can be made available by clicking ‘Update’.

‘Go offline’ will result in the initial state behavior already described.
Once you have published the application you most likely do not want to go offline again, instead if hosting the application reaches its end-of-life your system administrator probably no longer points the application URL to the application.
However, you could go offline after you no longer want to provide the application to your audience, but keep the CMS up und running in order to allow access to the STATISTICS section for _editors_ and _chiefeditors_.


## Advanced features on the CMS main screen

For _editors_, the action bar contains a ‘Local database’ panel, that allows the following 3 things.

  * Request a reset to factory settings and also cancellation of such a request.
  * Create a snapshot of the database for the current state of modifications performed in the sections METADATA, BRANDING and TRANSLATIONS.
  * Restore such a snapshot, or parts of it, as it is possible to indivdually choose which of the three sections should be restored.

_chiefeditors_ see the ‘Local database’ panel only if there is a request to reset to factory settings from an _editor_, which they can then decide to fulfill.


## Special/hidden features

### Incoming links

On top of the CMS, the BRANDING is also customizable by a referer providing one or more of the following URL parameters.

  * `logo`: a URL pointing to your company logo.
  * `url`: a URL pointing to your company website (clicking the logo will lead to this URL).
  * `bg`: a CSS color value for the header background.
  * `text`: a CSS color value for the header text.

Values provided in this manner would overrule the ones specified in the BRANDING section of the CMS.  
Important: If you want to test this you must not be logged into the CMS in your web browser, as in this case the current editorial state would supercede any incoming URL parameters.

> Overriding the branding specified in the CMS is something you will usually _not_ need, but it can be useful if the application is __hosted only once__ for multiple corporations or individually branded entities within a corporation.  
> Providing a `cid` on the other hand might come in handy for anyone.

Example: https://your-money-app-url.example.com/?url=https%3A%2F%2Fcompany.example.com%2F&logo=https%3A%2F%2Fcompany.example.com%2Flogo.png&bg=rgb(33%2C99%2C255)

Additionally to the four BRANDING-related URL parameters, you can also provide an identifier when calling the application, see next chapter for details.

  * `cid`: any form of identifier (which can be anything from a simple string to a JSON object).

### Outgoing links

The following typically applies to links in the ‘What to do next’ chapter found on the application’s `/result` page. Those can be edited in the CMS.
You can augment your outgoing links with an URL parameter named `cid` followed by an equals sign `=`.

The application looks for occurences of `cid=` within links and adds an incoming `cid` (see above) specified by a referer. By doing do, the original referer/caller can __pass information through the application__ to the final link target.

Example: https://company.example.com/my-product?cid=

Any combination with other URL parameters is supported. You can even add a value, e.g. `cid=default`. This value is then kept in place if no incoming `cid` has been provided; otherwise it will be replaced.
