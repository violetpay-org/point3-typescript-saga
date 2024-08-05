export interface EventIdempotenceProvider {
    // eventId가 이미 처리되었는지 확인합니다.
    isConsumed(eventId: string): Promise<boolean>;

    // mark에 성공했는지 실패했는지를 반환합니다. 실패했을 경우 이미 처리된 이벤트로 확인되어 다시 처리하지 않아야 합니다.
    markAsConsumed(eventId: string): Promise<boolean>;
}