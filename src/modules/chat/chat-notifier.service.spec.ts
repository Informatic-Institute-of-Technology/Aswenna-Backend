import { ChatNotifierService } from './chat-notifier.service';

describe('ChatNotifierService', () => {
  let service: ChatNotifierService;

  beforeEach(() => {
    service = new ChatNotifierService();
  });

  it('does not throw if server is not set', () => {
    expect(() => service.emitConversationCreated(['u1'], 'c1')).not.toThrow();
  });

  it('emits conversation:sync created to unique user rooms', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    service.setServer({ to } as any);

    service.emitConversationCreated(['u1', 'u1', 'u2', ''], 'c1');

    expect(to).toHaveBeenCalledTimes(2);
    expect(to).toHaveBeenCalledWith('user:u1');
    expect(to).toHaveBeenCalledWith('user:u2');
    expect(emit).toHaveBeenCalledWith('conversation:sync', {
      action: 'created',
      conversationId: 'c1',
    });
  });

  it('emits deleted sync payload', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    service.setServer({ to } as any);

    service.emitConversationDeleted(['u9'], 'c9');

    expect(emit).toHaveBeenCalledWith('conversation:sync', {
      action: 'deleted',
      conversationId: 'c9',
    });
  });
});
