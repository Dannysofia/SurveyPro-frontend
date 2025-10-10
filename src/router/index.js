import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import VistaUser from "@/views/VistaUser.vue";
import VistaDos from "@/views/VistaDos.vue";
import SurveyList from "@/views/surveys/SurveyList.vue";
import SurveyEditor from "@/views/surveys/SurveyEditor.vue";
import SurveyResponsesList from "@/views/surveys/SurveyResponsesList.vue";
import SurveyResponseDetail from "@/views/surveys/SurveyResponseDetail.vue";
import SurveyAnswer from "@/views/surveys/SurveyAnswer.vue";
import ResponsesDashboard from "@/views/surveys/ResponsesDashboard.vue";
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
        path: "/respuestas",
        name: "responses-dashboard",
        component: ResponsesDashboard,
      },
      {
        path: "/encuestas/nueva",
        name: "survey-editor",
        component: SurveyEditor,
      },
      {
        path: "/encuestas/:id/respuestas",
        name: "survey-responses",
        component: SurveyResponsesList,
      },
      {
        path: "/encuestas/:id/respuestas/:responseId",
        name: "survey-response-detail",
        component: SurveyResponseDetail,
      },
      {
        path: "/encuestas/:id/responder",
        name: "survey-answer",
        component: SurveyAnswer,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
