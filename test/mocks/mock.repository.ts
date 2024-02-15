export class MockRepository<T> {
  public entities: any[] = [];

  async save(entity: any): Promise<any> {
    if (!entity.name) {
      throw new Error();
    }

    if (!entity.id) {
      entity.id = this.entities.length + 1;
    } else {
      this.entities = this.entities.filter(e => e.id !== entity.id);
    }

    this.entities = [...this.entities, entity];

    return entity;
  }

  async findOne(id: any): Promise<any> {
    return await this.entities.find(entity => entity.id === id);
  }

  async findOneOrFail(id: any): Promise<any> {
    const e = await this.findOne(id);

    if (!e) {
      throw new Error();
    }

    return e;
  }

  async find(): Promise<any[]> {
    return await this.entities;
  }

  merge(entity: T, changes: Partial<T>): T {
    const c = Object.assign(entity, changes);
    this.entities.map(e => (e === entity ? c : e));
    return c;
  }

  async delete(id: any): Promise<void> {
    this.entities = this.entities.filter(e => e.id !== id);
  }

  async remove(entity: any): Promise<void> {
    this.entities = this.entities.filter(e => e !== entity);
  }
}
