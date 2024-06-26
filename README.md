# Test Design

This test is based on the @googlemaps/js-samples located at
https://github.com/googlemaps/js-samples.
We modified it to display 8 static Street View Panoramas sequentially. Additionally a Map of type google-map is displayed.

## Setup

You need to install [node js](https://nodejs.org/en) and [Git](https://git-scm.com/downloads) first.
When both of these are installed you can open up either Git Bash or Windows Powershell to clone this repository to your system.
```sh
git clone https://github.com/s81863/Testdesign.git
```
You'll also need to install [file-saver](https://www.npmjs.com/package/file-saver) and [jszip](https://www.npmjs.com/package/jszip).
```sh
npm install file-saver
npm install jszip
```
Then open up Powershell once more and move into the directory you just cloned. Typically it is saved to C:\Users\User\Testdesign

```sh
cd Path\to\Testdesign
```
To finally start, execute the following commands while you are in the directory
```sh
npm i
npm start
```
Now simply open a Browser of your choice and go to localhost:5173 You should see the test now.

## Feedback

For feedback related to this sample, please open a new issue on
[GitHub](https://github.com/s81863/Testdesign/issues).
