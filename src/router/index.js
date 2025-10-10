import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import VistaUser from "@/views/VistaUser.vue";
import VistaDos from "@/views/VistaDos.vue";
import SurveyList from "@/views/surveys/SurveyList.vue";
import SurveyEditor from "@/views/surveys/SurveyEditor.vue";
const routes = [
  {
    path: "/",
    name: "Home",
    component: MainLayout,
    children: [
      {
        path: "",
        name: "vistauser",
        component: VistaUser,
      },
      {
        path: "/vistados",
        name: "vistados",
        component: VistaDos,
      },
      {
        path: "/encuestas",
        name: "surveys",
        component: SurveyList,
      },
      {
        path: "/encuestas/nueva",
        name: "survey-editor",
        component: SurveyEditor,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
