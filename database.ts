import { PrismaClient as ImProcurementProd } from './prisma/clients/im-procurement-prod';
import { PrismaClient as ScmProd } from './prisma/clients/scm-prod';
import { PrismaClient as ScmOrderProd } from './prisma/clients/scm-order-prod';
import { PrismaClient as ImInventoryProd } from './prisma/clients/im-inventory-prod';
import { PrismaClient as ImProcurementDev } from './prisma/clients/im-procurement-dev';
import { PrismaClient as ScmPricingProd } from './prisma/clients/scm-pricing-prod';
import { PrismaClient as ImInventoryDev } from './prisma/clients/im-inventory-dev';
import { PrismaClient as ImInventoryLocal } from './prisma/clients/im-inventory-local';
import { PrismaClient as ImProcurementLocal } from './prisma/clients/local-im-procurement';
import { PrismaClient as ScmOrderLocal } from './prisma/clients/local-scm-order';
import { PrismaClient as ScmLocal } from './prisma/clients/local-scm';

export class DatabaseService {
  imProcurementProd: ImProcurementProd;
  scmProd: ScmProd;
  scmOrderProd: ScmOrderProd;
  imInventoryProd: ImInventoryProd;
  imProcurementDev: ImProcurementDev;
  scmPricingProd: ScmPricingProd;
  imInventoryDev: ImInventoryDev;
  imInventoryLocal: ImInventoryLocal;
  imProcurementLocal: ImProcurementLocal;
  scmOrderLocal: ScmOrderLocal;
  scmLocal: ScmLocal;

  constructor() {
    this.imProcurementProd = new ImProcurementProd();
    this.scmProd = new ScmProd();
    this.scmOrderProd = new ScmOrderProd();
    this.imInventoryProd = new ImInventoryProd();
    this.imProcurementDev = new ImProcurementDev();
    this.scmPricingProd = new ScmPricingProd();
    this.imInventoryDev = new ImInventoryDev();
    this.imInventoryLocal = new ImInventoryLocal();
    this.imProcurementLocal = new ImProcurementLocal();
    this.scmOrderLocal = new ScmOrderLocal();
    this.scmLocal = new ScmLocal();
  }

  async connect() {
    await Promise.all([
      this.imProcurementProd.$connect(),
      this.scmProd.$connect(),
      this.scmOrderProd.$connect(),
      this.imInventoryProd.$connect(),
      this.imProcurementDev.$connect(),
      this.scmPricingProd.$connect(),
      this.imInventoryDev.$connect(),
      this.imInventoryLocal.$connect(),
      this.imProcurementLocal.$connect(),
      this.scmOrderLocal.$connect(),
      this.scmLocal.$connect(),
    ]);
  }

  async disconnect() {
    await Promise.all([
      this.imProcurementProd.$disconnect(),
      this.scmProd.$disconnect(),
      this.scmOrderProd.$disconnect(),
      this.imInventoryProd.$disconnect(),
      this.imProcurementDev.$disconnect(),
      this.scmPricingProd.$disconnect(),
      this.imInventoryDev.$disconnect(),
      this.imInventoryLocal.$disconnect(),
      this.imProcurementLocal.$disconnect(),
      this.scmOrderLocal.$disconnect(),
      this.scmLocal.$disconnect(),
    ]);
  }
}
