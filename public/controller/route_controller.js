import { ShowhomePage } from "../View/home_page.js";
// import  {FilterPageView} from "../view/menu2_page.js"

export const routePathnames = {

    HOME: '/',

    // MENU2: '/menu2',

}

export const routes = [

    { path: routePathnames.HOME, page: ShowhomePage },

    // { path: routePathnames.MENU2, page: FilterPageView }

];


export function routing(pathname, hash) {


    const route = routes.find(r => r.path == pathname);

    if (route) {
        if (hash && hash.length > 1) {
            route.page(hash.substring(1));
        } else {
            route.page();

        }
    } else {

        routes[0].page();
    }

}