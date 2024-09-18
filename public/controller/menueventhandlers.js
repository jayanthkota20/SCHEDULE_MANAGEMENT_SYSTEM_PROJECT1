import { ShowhomePage } from "../View/home_page.js";
// import { FilterPageView } from "../view/menu2_page.js";
import { signOutFirebase } from "./firebase_auth.js";
import { routePathnames } from "./route_controller.js";

export function onClickHomeMenu(e) {
    history.pushState(null, null, routePathnames.HOME);
    ShowhomePage();
}

// export function onClickFilterMenu(e) {
//     history.pushState(null, null, routePathnames.MENU2);
//     FilterPageView();
// }

export async function onClickSignoutMenu(e) {
    await signOutFirebase(e);
}