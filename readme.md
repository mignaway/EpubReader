<p align="center">
<!-- static image <img src="https://user-images.githubusercontent.com/40722616/173697452-302514f6-0c85-4e8a-beb6-07fa6ea5126e.png"> -->
<!-- <img src="https://user-images.githubusercontent.com/40722616/173834545-7cfbe16c-19e7-4efd-a4de-bb0b6cce1c3d.gif"> -->
<img src="https://user-images.githubusercontent.com/40722616/176784477-56b65065-b705-4bb7-b67a-4c49b863c15d.gif">

</p>

# EpubReader 

<!-- <a href="https://github.com/mignaway/EpubReader/releases/download/v1.0.1/Setup.v1.0.1.exe"><img src="https://user-images.githubusercontent.com/40722616/187921781-d02952a2-f3e2-4c2f-9b67-718994b0f49a.svg"></a> -->
<a href="https://github.com/mignaway/EpubReader/releases/download/v1.0.4/EpubReader.Setup.1.0.4.exe"><img src="https://img.shields.io/badge/v1.0.4-Installer-yellow"></a>
<a href="https://mignaway.github.io/epub-reader-website/"><img src="https://user-images.githubusercontent.com/40722616/192098396-694ce4b1-15fb-495f-ba89-241043d2d8bd.svg"></a>


EpubReader is a open-source project made with [ElectronJS](https://www.electronjs.org/). Like the name says it's an application for reading ***.epub*** files, there are already a thousand of epub reader but their UI/UX it's really bad. I started this project for letting people read epub books in a nice way with a well-made application.

> **Warning** : This project is under development, you might experience some bugs!

## Preview
<!-- <img src="https://user-images.githubusercontent.com/40722616/176780491-6f7c7711-780f-4d96-bd2d-dc51fb7b5164.jpg" width="100%"> -->
<!-- <img src="https://user-images.githubusercontent.com/40722616/176781677-4b024470-9a6b-4e93-81c2-ea6a6898b3c1.jpg" width="100%"> -->
<img src="https://user-images.githubusercontent.com/40722616/191061901-c6437634-5a80-434e-bf90-e4cc14c97682.png" width="100%">
More updated previews are <a href="https://github.com/mignaway/EpubReader/blob/master/git-previews/1.0.4.md">available here</a>



<!--
***(Dashboard)***

<img src="https://user-images.githubusercontent.com/40722616/173415028-c2f8e59a-fc31-48cd-a2fa-fb7b7c3803d4.gif" width="100%">

***(Library)***

<img src="https://user-images.githubusercontent.com/40722616/173831311-2f67d669-7ea1-41b3-b93e-57321416504b.png" width="100%">
-->

## Version Logs

<details open><summary><h3>v.1.0.5 (Developing)</h3></summary>

- PDF support
- Resizable Book Window
- Now you can edit your books
- Update feature

</details>

<details open><summary><h3>v1.0.4 (Stable release)</h3></summary>

- Update feature (posticipated to v1.0.5 due important fix in order distribute a soon as possible a more stable version)
- Linux distribution (.deb)
- Added multiple book layouts (paginated, scrolling)
- Design fixes and improvements
- Improved Save Page feature
- Important fixes from previous version
    - Book covers are now shown and saved correctly
    - Epub drop fixed glitch
    - Fixed dashboard book sorting

</details>

<details><summary><h3>v1.0.3</h3></summary>

- Epub folder moved to the user's roaming folder
- Now you can directly drop the file in the application
- Asar
- General fixes
- A lot of refactoring

</details>

## Testing
To clone locally this project you'll need [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/en/download/) installed on your computer.
Then clone the project with these command line:<br><br>
_(Windows)_
```bash
# Clone this repository
git clone https://github.com/mignaway/EpubReader
# Go into the repository
cd EpubReader
# Install dependencies
npm install
# Run the app
npm start
```

## Useful documentations
* [electronjs.org/docs](electronjs.org/docs) - Electron's documentation
* [https://git-scm.com/docs](https://git-scm.com/docs) - Git's documentation
