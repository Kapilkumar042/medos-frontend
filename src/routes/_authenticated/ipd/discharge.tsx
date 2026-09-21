import { createFileRoute } from "@tanstack/react-router";
import { IpdPatientsPage } from "./patients";

export const Route = createFileRoute("/_authenticated/ipd/discharge")({
  component: IpdPatientsPage,
});