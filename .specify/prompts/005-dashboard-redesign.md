# Feature Prompt 005

## Feature Title
Redesign the user dashboard with new light and dark themes, creating reusable components and preparing for future features.

## Summary
In the docs/design there are the new designs for the user dashboard with light and dark versions.:
Light: docs/design/user_dashboard_light.html and docs/design/user_dashboard_light.png
Dark: docs/design/user_dashboard_dark.html and docs/design/user_dashboard_dark.png
There are for both versions an HTML file with the structure and all the components, colors and styles, and also an image on how it must look like.
You are the designer and developer responsible to revamp this app with this new style.
Make the effort to create components for what makes sense, and think about reusability as mush as possible.
The page MUST be ssr, each section MUST be a component that loads its own data asynchronously, in parallel with a loading state and a error state, these both states must be common for all components.
In summary you are not only redesigning the whole dashboard, but preparing the application evolution for new features, also a t the same time creating interactive, rich and data driving components to be reused.
The other pages DO NOT need to change this time, the only direct page to change is the Dashboard and its components, of course, any component that need to navigate to an existing page can do it, or any other that needs a new page, you can create a simple page example for it
global.css contains the theme of application, make changes there if needed to.

