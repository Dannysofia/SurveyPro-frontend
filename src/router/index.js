import { createRouter, createWebHistory } from "vue-router";
import HomeLayout from "@/layouts/HomeLayout.vue";
import LoginView from "@/views/users/LoginView.vue";
import RegisterView from "@/views/users/RegisterView.vue";
import SurveyHome from "@/views/surveys/SurveyHome.vue";
import SurveyList from "@/views/surveys/SurveyList.vue";
import SurveyEditor from "@/views/surveys/SurveyEditor.vue";
import SurveyResponsesList from "@/views/responses/SurveyResponsesList.vue";
import SurveyResponseDetail from "@/views/responses/SurveyResponseDetail.vue";
import SurveyAnswer from "@/views/surveys/SurveyAnswer.vue";
import ResponsesDashboard from "@/views/responses/ResponsesDashboard.vue";
import HomeSurveyPro from "@/views/HomeSurveyPro.vue";
import ProfileView from "@/views/users/ProfileView.vue";
import ProfileEditView from "@/views/users/ProfileEditView.vue";


const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeLayout,
    children: [
      {
        path: "",
        name: "home",
        component: HomeSurveyPro,
      },
      {
        path: "login",
        name: "login",
        component: LoginView,
      },
      {
        path: "register",
        name: "register",
        component: RegisterView,
      },
      {
        path: "inicio",
        name: "survey-home",
        component: SurveyHome,
      },
      {
        path: "perfil",
        name: "profile",
        component: ProfileView,
      },
      {
        path: "perfil/editar",
        name: "profile-edit",
        component: ProfileEditView,
      },
      {
        path: "encuestas",
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
        name: "survey-create",
        component: SurveyCreate,
      },
      {
        path: "/encuestas/:id/editar",
        name: "survey-edit",
        component: SurveyEdit,
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