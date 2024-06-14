import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fsPromises from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileSystemService {
  async processFile(
    destination: any,
    fileExtension: any,
    data: any,
  ): Promise<{ filePath: string }> {
    const directory = `uploaded-files/users/${destination}`;

    const isDirectoryExist = await this.checkPathExist(directory);

    if (!isDirectoryExist) {
      await fsPromises.mkdir('./' + directory, { recursive: true });
    }

    const uid = uuidv4();
    const fullPath = `${directory}/${uid}.${fileExtension}`;

    try {
      await fsPromises.writeFile(fullPath, data, 'utf8');
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    return { filePath: fullPath };
  }

  async checkPathExist(path: string): Promise<boolean> {
    return await fsPromises
      .access(path, fsPromises.constants.F_OK)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * `deleteFile()`: deletes file according to provided path. Note, it checks for the path before deleting it
   * @param path
   */
  async deleteFile(path: string): Promise<boolean> {
    if (await this.checkPathExist(path)) {
      await fsPromises.unlink(path);
      return true;
    }
    return false;
  }
}
