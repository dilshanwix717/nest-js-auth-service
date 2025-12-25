import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RpcArgumentsHost } from '@nestjs/common/interfaces';

export const RpcPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const rpc: RpcArgumentsHost = ctx.switchToRpc();
    return rpc.getData();
  },
);
