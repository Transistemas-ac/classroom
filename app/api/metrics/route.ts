import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    cursos_dictados: 26,
    ayudas_sociales: 500,
    voluntaries: 19,
    egresades: 1789,
    personas_con_trabajo_registrado: 350,
  });
}
