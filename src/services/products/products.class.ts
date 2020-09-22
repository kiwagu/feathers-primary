import { Service, MongooseServiceOptions } from 'feathers-mongoose';
import { Application } from '../../declarations';

export interface ProductData {
  title: string,
  description: string,
  cost: number
}

export class Products extends Service<ProductData> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
  }
}
