-- AddForeignKey
ALTER TABLE "PropostaTroca" ADD CONSTRAINT "PropostaTroca_cotaOfertadaId_fkey" FOREIGN KEY ("cotaOfertadaId") REFERENCES "Cota"("id") ON DELETE SET NULL ON UPDATE CASCADE;
