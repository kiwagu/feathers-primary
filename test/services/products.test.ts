import app from '../../src/app';

// TODO: define TS types

describe('\'products\' service', () => {
  let productsService;

  beforeAll(() => {
    productsService = app.service('products');
  });

  it('registered the products service', () => {
    expect(productsService).toBeTruthy();
  });

  it('creates and processes product', async () => {
    const title = 'Product 123456';
    const product = await productsService.create(
      {
        title,
        description: 'Description for product 1',
        cost: 100,
      },
    );
    expect(product).toBeDefined();

    // Clean created product from db
    const removedProduct = await productsService.remove({
      _id: product._id,
    });
    expect(removedProduct).toBeDefined();
    expect(removedProduct.title).toBe(title);
  });
});
