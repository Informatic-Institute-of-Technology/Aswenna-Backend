import { WsException } from '@nestjs/websockets';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  const conversationsService = {
    ensureMember: jest.fn(),
  } as any;

  const messagesService = {
    sendMessage: jest.fn(),
    markConversationRead: jest.fn(),
  } as any;

  const jwtService = {
    verifyAsync: jest.fn(),
  } as any;

  const chatNotifierService = {
    setServer: jest.fn(),
  } as any;

  const createGateway = () =>
    new ChatGateway(
      conversationsService,
      messagesService,
      jwtService,
      chatNotifierService,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('afterInit registers server in notifier', () => {
    const gateway = createGateway();
    const server = {} as any;

    gateway.afterInit(server);

    expect(chatNotifierService.setServer).toHaveBeenCalledWith(server);
  });

  it('handleConnection disconnects when token is invalid', async () => {
    const gateway = createGateway();
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    const client = {
      handshake: { auth: { token: 'Bearer bad' }, headers: {} },
      disconnect: jest.fn(),
      join: jest.fn(),
      data: {},
    } as any;

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('joinConversation throws WsException when user is missing', async () => {
    const gateway = createGateway();
    const client = { data: {}, join: jest.fn() } as any;

    await expect(
      gateway.joinConversation(client, {
        conversationId: '67d3e18216f3ec23296ef903',
      }),
    ).rejects.toThrow(new WsException('Unauthorized'));
  });

  it('sendMessage emits message:new and returns ack payload', async () => {
    const gateway = createGateway() as any;
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
    messagesService.sendMessage.mockResolvedValue({ _id: 'm1' });

    const client = { data: { userId: '67d3e18216f3ec23296ef901' } } as any;
    const result = await gateway.sendMessage(client, {
      conversationId: '67d3e18216f3ec23296ef903',
      content: 'Hello',
    });

    expect(messagesService.sendMessage).toHaveBeenCalled();
    expect(result).toEqual({
      event: 'message:sent',
      data: { id: 'm1', conversationId: '67d3e18216f3ec23296ef903' },
    });
  });

  it('readReceipt emits message:read and returns ack payload', async () => {
    const gateway = createGateway() as any;
    const emit = jest.fn();
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit }),
    };
    messagesService.markConversationRead.mockResolvedValue({
      conversationId: '67d3e18216f3ec23296ef903',
      userId: '67d3e18216f3ec23296ef901',
      messageIds: ['m1'],
    });

    const client = { data: { userId: '67d3e18216f3ec23296ef901' } } as any;
    const result = await gateway.readReceipt(client, {
      conversationId: '67d3e18216f3ec23296ef903',
      messageIds: ['67d3e18216f3ec23296ef8aa'],
    });

    expect(emit).toHaveBeenCalledWith('message:read', {
      conversationId: '67d3e18216f3ec23296ef903',
      userId: '67d3e18216f3ec23296ef901',
      messageIds: ['m1'],
    });
    expect(result.event).toBe('message:read:ack');
  });
});
