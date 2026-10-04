// Gerado por tools/dump/fetch-api.mjs a partir de /help?format=Full. Não editar.

export type AggregationType = "average" | "none" | "sum";
export interface AlertDTO {
  "alertTime": number;
}
export interface BannedChampion {
  "championId": number;
  "teamId": number;
  "pickTurn": number;
}
export interface BasePlayerDTO {
  "code": number;
  "message": string;
  "data": MatchedPlayerDTO;
}
export interface BenchChampion {
  "championId": number;
  "isPriority": boolean;
}
export interface BindingAsyncCancelEvent {
  "asyncToken": number;
}
export interface BindingAsyncFailureEvent {
  "asyncToken": number;
  "error": string;
}
export type BindingAsyncState = "Cancelled" | "Cancelling" | "Failed" | "None" | "Running" | "Succeeded";
export interface BindingCallbackEvent {
  "id": number;
  "parameters": unknown[];
}
export interface BindingFullApiHelp {
  "functions": BindingFullFunctionHelp[];
  "types": BindingFullTypeHelp[];
  "events": BindingFullEventHelp[];
}
export interface BindingFullArgumentHelp {
  "name": string;
  "description": string;
  "type": BindingFullTypeIdentifier;
  "optional": boolean;
}
export interface BindingFullEnumValueHelp {
  "name": string;
  "description": string;
  "value": number;
}
export interface BindingFullEventHelp {
  "name": string;
  "nameSpace": string;
  "type": BindingFullTypeIdentifier;
  "description": string;
  "tags": string[];
}
export interface BindingFullFieldHelp {
  "name": string;
  "description": string;
  "offset": number;
  "type": BindingFullTypeIdentifier;
  "optional": boolean;
}
export interface BindingFullFunctionHelp {
  "name": string;
  "nameSpace": string;
  "arguments": BindingFullArgumentHelp[];
  "returns": BindingFullTypeIdentifier;
  "description": string;
  "help": string;
  "threadSafe": boolean;
  "async": string;
  "tags": string[];
}
export interface BindingFullTypeHelp {
  "name": string;
  "nameSpace": string;
  "size": number;
  "description": string;
  "tags": string[];
  "fields": BindingFullFieldHelp[];
  "values": BindingFullEnumValueHelp[];
}
export interface BindingFullTypeIdentifier {
  "type": string;
  "elementType": string;
}
export interface BindingGenericAsyncEvent {
  "asyncToken": number;
  "data": unknown;
}
export interface BindingGenericEvent {
  "data": unknown;
}
export type BindingHelpFormat = "Epytext" | "Full";
export interface BoostTeamSkinRentalDTO {
  "summonerName": string;
  "summonerId": number;
  "puuid": string;
  "skinUnlockMode": string;
  "price": number;
  "ipReward": number;
  "ipRewardForPurchaser": number;
  "availableSkins": number[];
  "unlocked": boolean;
}
export interface Bracket {
  "version": number;
  "tournamentId": number;
  "phaseId": number;
  "id": number;
  "size": number;
  "matches": BracketMatch[];
  "rosters": BracketRoster[];
}
export interface BracketMatch {
  "id": number;
  "round": number;
  "order": number;
  "rosterId1": number;
  "rosterId2": number;
  "resultHistory": string;
  "lowestPossiblePosition": number;
  "highestPossiblePosition": number;
  "roundStartTime": number;
  "gameStartTime": number;
  "status": ClientBracketMatchStatus;
  "winnerId": number;
  "gameId": number;
  "loserBracket": boolean;
  "forfeitRosterId": number;
  "failRosterStatus": number;
}
export interface BracketRoster {
  "rosterId": number;
  "name": string;
  "shortName": string;
  "logo": number;
  "logoColor": number;
}
export interface BuildInfo {
  "branch": string;
  "patchline": string;
  "version": string;
  "patchlineVisibleName": string;
  "buildType": string;
}
export type CapacityEnum = "FULL" | "HIGH" | "LOW" | "MEDIUM";
export interface ChampSelectBannedChampions {
  "myTeamBans": number[];
  "theirTeamBans": number[];
  "numBans": number;
}
export interface ChampSelectChatRoomDetails {
  "multiUserChatId": string;
  "multiUserChatPassword": string;
  "mucJwtDto": MucJwtDto;
}
export interface ChampSelectLcdsGameDTO {
  "id": number;
  "gameState": string;
  "queueTypeName": string;
  "roomName": string;
  "roomPassword": string;
  "mucJwtDto": MucJwtDto;
  "name": string;
  "playerChampionSelections": ChampSelectLcdsPlayerChampionSelectionDTO[];
  "bannedChampions": BannedChampion[];
  "teamOne": unknown[];
  "teamTwo": unknown[];
  "statusOfParticipants": string;
  "optimisticLock": number;
  "pickTurn": number;
  "spectatorDelay": number;
  "gameMutators": string[];
}
export interface ChampSelectLcdsGameTimerDTO {
  "currentGameState": string;
  "remainingTimeInMillis": number;
}
export interface ChampSelectLcdsObfuscatedParticipant {
  "gameUniqueId": number;
}
export interface ChampSelectLcdsPlayerChampionSelectionDTO {
  "summonerInternalName": string;
  "summonerId": number;
  "puuid": string;
  "championId": number;
  "selectedSkinIndex": number;
  "spell1Id": number;
  "spell2Id": number;
}
export interface ChampSelectLcdsPlayerParticipant {
  "summonerName": string;
  "summonerInternalName": string;
  "summonerId": number;
  "puuid": string;
  "pickMode": number;
  "pickTurn": number;
}
export interface ChampSelectLcdsPointSummary {
  "pointsToNextRoll": number;
  "currentPoints": number;
  "numberOfRolls": number;
  "maxRolls": number;
  "pointsCostToRoll": number;
}
export interface ChampSelectLcdsPotentialTradersDTO {
  "potentialTraders": string[];
}
export interface ChampSelectLcdsRollResult {
  "championId": number;
  "pointSummary": ChampSelectLcdsPointSummary;
}
export interface ChampSelectLcdsTradeContractDTO {
  "requesterInternalSummonerName": string;
  "requesterSummonerId": number;
  "requesterPuuid": string;
  "responderInternalSummonerName": string;
  "responderSummonerId": number;
  "responderPuuid": string;
  "requesterChampionId": number;
  "responderChampionId": number;
  "state": string;
}
export interface ChampSelectMySelection {
  "selectedSkinId"?: number;
  "spell1Id"?: number;
  "spell2Id"?: number;
}
export interface ChampSelectPlayerSelection {
  "cellId": number;
  "championId": number;
  "selectedSkinId": number;
  "spell1Id": number;
  "spell2Id": number;
  "team": number;
  "assignedPosition": string;
  "championPickIntent": number;
  "summonerId": number;
  "gameName": string;
  "tagLine": string;
  "puuid": string;
  "isHumanoid": boolean;
  "nameVisibilityType": string;
  "obfuscatedSummonerId": number;
  "obfuscatedPuuid": string;
}
export interface ChampSelectSession {
  "gameId": number;
  "timer": ChampSelectTimer;
  "chatDetails": ChampSelectChatRoomDetails;
  "myTeam": ChampSelectPlayerSelection[];
  "theirTeam": ChampSelectPlayerSelection[];
  "trades": ChampSelectSwapContract[];
  "pickOrderSwaps": ChampSelectSwapContract[];
  "positionSwaps": ChampSelectSwapContract[];
  "actions": unknown[];
  "bans": ChampSelectBannedChampions;
  "localPlayerCellId": number;
  "isSpectating": boolean;
  "allowSkinSelection": boolean;
  "allowSubsetChampionPicks": boolean;
  "allowDuplicatePicks": boolean;
  "allowPlayerPickSameChampion": boolean;
  "disallowBanningTeammateHoveredChampions": boolean;
  "allowBattleBoost": boolean;
  "boostableSkinCount": number;
  "allowRerolling": boolean;
  "rerollsRemaining": number;
  "allowLockedEvents": boolean;
  "lockedEventIndex": number;
  "benchEnabled": boolean;
  "benchChampions": BenchChampion[];
  "counter": number;
  "skipChampionSelect": boolean;
  "hasSimultaneousBans": boolean;
  "hasSimultaneousPicks": boolean;
  "showQuitButton": boolean;
  "isLegacyChampSelect": boolean;
  "isCustomGame": boolean;
}
export interface ChampSelectSwapContract {
  "id": number;
  "cellId": number;
  "state": ChampSelectSwapState;
}
export type ChampSelectSwapState = "ACCEPTED" | "AVAILABLE" | "BUSY" | "CANCELLED" | "DECLINED" | "INVALID" | "RECEIVED" | "SENT";
export interface ChampSelectTimer {
  "adjustedTimeLeftInPhase": number;
  "totalTimeInPhase": number;
  "phase": string;
  "isInfinite": boolean;
  "internalNowInEpochMs": number;
}
export interface ChampionMasteryPublicDTO {
  "championId": number;
  "championLevel": number;
  "championPoints": number;
}
export interface ChampionScoutingDTO {
  "championId": number;
  "winCount": number;
  "gameCount": number;
  "kda": number;
}
export interface ChemtechShoppe_CatalogEntryDto {
  "id": string;
  "name": string;
  "productId": string;
  "purchaseUnits": ChemtechShoppe_PurchaseUnitDto[];
  "displayMetadata": unknown;
  "prerequisites": ChemtechShoppe_PrerequisiteDto[];
  "purchaseVisibility": string;
  "refundRule": string;
  "giftRule": string;
  "purchaseLimits": ChemtechShoppe_VelocityLimitDeltaDto[];
  "refundLimits": ChemtechShoppe_VelocityLimitDeltaDto[];
  "endTime": string;
}
export interface ChemtechShoppe_CatalogEntryResponseDto {
  "data": ChemtechShoppe_CatalogEntryDto;
  "paging": ChemtechShoppe_PagingDto;
  "stats": ChemtechShoppe_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppe_DropsMultiRollResultsDto {
  "rolls": ChemtechShoppe_DropsRollResultsDto[];
}
export interface ChemtechShoppe_DropsRollResultsDto {
  "fulfillments": unknown[];
  "rolledFulfillments": ChemtechShoppe_RolledFulfillmentWrapperDto[];
}
export interface ChemtechShoppe_FinalPurchaseUnitDto {
  "payments": ChemtechShoppe_PaymentDto[];
  "fulfillment": ChemtechShoppe_FulfillmentDto;
}
export interface ChemtechShoppe_FulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "ownershipCompensationMode": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "counterId": string;
  "displayMetadata": unknown;
  "dropTableId": string;
  "results": ChemtechShoppe_DropsMultiRollResultsDto;
  "itemTypeId": string;
  "itemId": string;
  "itemPayload": Record<string, unknown>;
  "itemInstanceId": string;
  "tierTypeId": string;
  "progressionCounterId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
  "location": string;
  "payload": unknown;
  "target": string;
}
export interface ChemtechShoppe_PagingDto {
  "offset": number;
  "limit": number;
  "maxLimit": number;
  "total": number;
  "previous": string;
  "next": string;
}
export interface ChemtechShoppe_PaymentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "discountedDelta": number;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "discountPercent": number;
}
export interface ChemtechShoppe_PaymentOptionDto {
  "key": string;
  "payments": ChemtechShoppe_PaymentDto[];
}
export interface ChemtechShoppe_PrerequisiteDto {
  "status": string;
  "itemTypeId": string;
  "itemId": string;
  "requiredQuantity": number;
  "ownedQuantity": number;
  "milestoneId": string;
  "catalogEntryId": string;
}
export interface ChemtechShoppe_PurchaseDto {
  "id": string;
  "idempotencyId": string;
  "productId": string;
  "purchaserId": string;
  "recipientId": string;
  "storeId": string;
  "storeName": string;
  "catalogEntryId": string;
  "catalogEntryName": string;
  "purchaseUnits": ChemtechShoppe_FinalPurchaseUnitDto[];
  "createdTime": string;
  "purchaseState": string;
  "source": string;
  "purchaseVisibility": string;
  "refundRule": string;
  "completedTime": string;
  "refund": ChemtechShoppe_RefundDto;
  "quantity": number;
}
export interface ChemtechShoppe_PurchaseRequestDto {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "idempotencyId": string;
  "quantity": number;
  "customInventoryLocation": string;
  "purchaserId": string;
  "source": string;
}
export interface ChemtechShoppe_PurchaseResponseDto {
  "data": ChemtechShoppe_PurchaseDto;
  "paging": ChemtechShoppe_PagingDto;
  "stats": ChemtechShoppe_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppe_PurchaseUnitDto {
  "paymentOptions": ChemtechShoppe_PaymentOptionDto[];
  "fulfillment": ChemtechShoppe_FulfillmentDto;
}
export interface ChemtechShoppe_PurchasesResponseDto {
  "data": ChemtechShoppe_PurchaseDto[];
  "paging": ChemtechShoppe_PagingDto;
  "stats": ChemtechShoppe_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppe_RefundDto {
  "id": string;
  "purchaseId": string;
  "createdTime": string;
  "state": string;
  "completedTime": string;
  "source": string;
}
export interface ChemtechShoppe_RefundRequestDto {
  "purchaseId": string;
  "source": string;
}
export interface ChemtechShoppe_RefundResponseDto {
  "data": ChemtechShoppe_RefundDto;
  "paging": ChemtechShoppe_PagingDto;
  "stats": ChemtechShoppe_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppe_RolledFulfillmentWrapperDto {
  "nodeId": string;
  "nodeName": string;
  "fulfillment": unknown;
}
export interface ChemtechShoppe_RotatingStoreMetadataDto {
  "slots": ChemtechShoppe_RotatingStoreSlotMetadataDto[];
  "currRotationStartTime": string;
  "nextRotationStartTime": string;
  "rotationCadence": string;
}
export interface ChemtechShoppe_RotatingStoreSlotMetadataDto {
  "selectionCount": number;
  "catalogEntryIds": string[];
}
export interface ChemtechShoppe_StatsDto {
  "durationMs": number;
}
export interface ChemtechShoppe_StoreDigestDto {
  "id": string;
  "productId": string;
  "name": string;
  "displayMetaData": unknown;
  "startTime": string;
  "endTime": string;
  "rotatingStoreMetadata": ChemtechShoppe_RotatingStoreMetadataDto;
}
export interface ChemtechShoppe_StoreDigestsDto {
  "digests": ChemtechShoppe_StoreDigestDto[];
}
export interface ChemtechShoppe_StoreDigestsResponseDto {
  "data": ChemtechShoppe_StoreDigestsDto;
  "paging": ChemtechShoppe_PagingDto;
  "stats": ChemtechShoppe_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppe_StoreDto {
  "id": string;
  "type": string;
  "productId": string;
  "name": string;
  "catalogEntries": ChemtechShoppe_CatalogEntryDto[];
  "displayMetadata": unknown;
  "startTime": string;
  "endTime": string;
  "rotatingStoreMetadata": ChemtechShoppe_RotatingStoreMetadataDto;
  "prerequisiteCatalogEntries": ChemtechShoppe_CatalogEntryDto[];
}
export interface ChemtechShoppe_StoreResponseDto {
  "data": ChemtechShoppe_StoreDto;
  "paging": ChemtechShoppe_PagingDto;
  "stats": ChemtechShoppe_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppe_StoresResponseDto {
  "data": ChemtechShoppe_StoreDto[];
  "paging": ChemtechShoppe_PagingDto;
  "stats": ChemtechShoppe_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppe_VelocityLimitDeltaDto {
  "ruleId": string;
  "delta": number;
  "remaining": number;
}
export interface ChemtechShoppeV2_BulkPurchaseRequestDto {
  "bulkPurchaseId": string;
  "purchaserId": string;
  "source": string;
  "subPurchaseRequests": ChemtechShoppeV2_SubPurchaseRequestDto[];
}
export interface ChemtechShoppeV2_BulkPurchaseResponseDto {
  "bulkPurchaseId": string;
  "purchases": ChemtechShoppeV2_PurchaseDto[];
}
export interface ChemtechShoppeV2_CatalogEntryDto {
  "id": string;
  "name": string;
  "productId": string;
  "purchaseUnits": ChemtechShoppeV2_PurchaseUnitDto[];
  "displayMetadata": unknown;
  "prerequisites": ChemtechShoppeV2_PrerequisiteDto[];
  "purchaseVisibility": string;
  "refundRule": string;
  "giftRule": string;
  "purchaseLimits": ChemtechShoppeV2_VelocityLimitDeltaDto[];
  "refundLimits": ChemtechShoppeV2_VelocityLimitDeltaDto[];
  "endTime": string;
}
export interface ChemtechShoppeV2_DropTableOddsTreeDto {
  "nodeHierarchy": Record<string, ChemtechShoppeV2_DropTableOddsTreeHierarchyDto>;
  "nodes": Record<string, ChemtechShoppeV2_DropTableOddsTreeNodeDto>;
  "nodeTraKeys": Record<string, ChemtechShoppeV2_NodeTraKeyDto>;
  "rootNodeId": string;
  "templateName": string;
  "startDate": string;
  "endDate": string;
}
export interface ChemtechShoppeV2_DropTableOddsTreeHierarchyDto {
  "edges": ChemtechShoppeV2_DropTableOddsTreeHierarchyEdgeDto[];
}
export interface ChemtechShoppeV2_DropTableOddsTreeHierarchyEdgeDto {
  "targetNodeId": string;
  "odds": number;
  "type": string;
}
export interface ChemtechShoppeV2_DropTableOddsTreeNodeDto {
  "id": string;
  "name": string;
  "displayPriority": number;
  "sourceId": string;
  "rewardQuantity": number;
  "type": string;
}
export interface ChemtechShoppeV2_DropTableOddsTreeResponseDto {
  "data": ChemtechShoppeV2_DropTableOddsTreeDto;
  "paging": ChemtechShoppeV2_PagingDto;
  "stats": ChemtechShoppeV2_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppeV2_DropsMultiRollResultsDto {
  "rolls": ChemtechShoppeV2_DropsRollResultsDto[];
}
export interface ChemtechShoppeV2_DropsRollResultsDto {
  "fulfillments": unknown[];
  "rolledFulfillments": ChemtechShoppeV2_RolledFulfillmentWrapperDto[];
}
export interface ChemtechShoppeV2_ExpectedChangeDto {
  "expectedDelta": number;
  "counterId": string;
  "payload": unknown;
  "target": string;
  "dropTableId": string;
  "itemTypeId": string;
  "itemId": string;
  "itemInstanceId": string;
  "tierTypeId": string;
  "duration": number;
  "progressionCounterId": string;
  "currencyId": string;
}
export interface ChemtechShoppeV2_ExpectedChangesDto {
  "expectedPaymentChanges": ChemtechShoppeV2_ExpectedChangeDto[];
  "expectedFulfillmentChanges": ChemtechShoppeV2_ExpectedChangeDto[];
}
export interface ChemtechShoppeV2_FinalPurchaseUnitDto {
  "payments": ChemtechShoppeV2_PaymentDto[];
  "fulfillment": ChemtechShoppeV2_FulfillmentDto;
}
export interface ChemtechShoppeV2_FulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "ownershipCompensationMode": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "counterId": string;
  "displayMetadata": unknown;
  "dropTableId": string;
  "results": ChemtechShoppeV2_DropsMultiRollResultsDto;
  "itemTypeId": string;
  "itemId": string;
  "itemPayload": Record<string, unknown>;
  "itemInstanceId": string;
  "tierTypeId": string;
  "progressionCounterId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
  "location": string;
  "payload": unknown;
  "target": string;
}
export interface ChemtechShoppeV2_GiftDto {
  "id": string;
  "idempotencyId": string;
  "productId": string;
  "purchaserId": string;
  "recipientId": string;
  "storeId": string;
  "storeName": string;
  "catalogEntryId": string;
  "catalogEntryName": string;
  "purchaseUnits": ChemtechShoppeV2_FinalPurchaseUnitDto[];
  "purchaserTransactionId": string;
  "createdTime": string;
  "state": string;
  "source": string;
  "refundRule": string;
  "messageToRecipient": string;
  "catalogEntry": ChemtechShoppeV2_CatalogEntryDto;
  "recipientTransactionId": string;
  "expiryTime": string;
  "completedTime": string;
  "refund": ChemtechShoppeV2_GiftRefundDto;
  "recipientMailId": string;
  "purchaserMailId": string;
  "quantity": number;
}
export interface ChemtechShoppeV2_GiftPurchaserEligibilityV2ResponseDto {
  "validationFailures": string[];
}
export interface ChemtechShoppeV2_GiftPurchaserRecipientEligibilityRequestV2Dto {
  "catalogEntryIds": unknown;
  "purchaserId": string;
  "recipientId": string;
  "giftPaymentType": string;
}
export interface ChemtechShoppeV2_GiftPurchaserRecipientEligibilityResponseV2Dto {
  "purchaserValidationFailures": string[];
  "recipientValidationFailures": string[];
  "catalogEntryValidationFailures": unknown;
  "finalizedCatalogEntries": unknown;
}
export interface ChemtechShoppeV2_GiftRecipientsEligibilityV2ResponseDto {
  "validRecipients": ChemtechShoppeV2_ValidRecipientDto[];
  "invalidRecipients": ChemtechShoppeV2_InvalidGiftRecipientDto[];
}
export interface ChemtechShoppeV2_GiftRefundDto {
  "id": string;
  "giftId": string;
  "createdTime": string;
  "state": string;
  "source": string;
  "refundReason": string;
  "completedTime": string;
}
export interface ChemtechShoppeV2_GiftRequestDtoV2 {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "purchaserId": string;
  "recipientId": string;
  "idempotencyId": string;
  "quantity": number;
  "messageToRecipient": string;
  "source": string;
  "expectedChanges": ChemtechShoppeV2_ExpectedChangesDto;
  "customInventoryLocation": string;
  "metadata": unknown;
}
export interface ChemtechShoppeV2_InvalidGiftRecipientDto {
  "puuid": string;
  "riotId": ChemtechShoppeV2_RiotId;
  "validationFailures": string[];
}
export interface ChemtechShoppeV2_NodeTraKeyDto {
  "nameTraKey": string;
}
export interface ChemtechShoppeV2_PagingDto {
  "offset": number;
  "limit": number;
  "maxLimit": number;
  "total": number;
  "previous": string;
  "next": string;
}
export interface ChemtechShoppeV2_PaymentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "discountedDelta": number;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "discountPercent": number;
}
export interface ChemtechShoppeV2_PaymentOptionDto {
  "key": string;
  "payments": ChemtechShoppeV2_PaymentDto[];
}
export interface ChemtechShoppeV2_PrerequisiteDto {
  "status": string;
  "itemTypeId": string;
  "itemId": string;
  "requiredQuantity": number;
  "ownedQuantity": number;
  "milestoneId": string;
  "catalogEntryId": string;
}
export interface ChemtechShoppeV2_PurchaseDto {
  "id": string;
  "idempotencyId": string;
  "productId": string;
  "purchaserId": string;
  "recipientId": string;
  "storeId": string;
  "storeName": string;
  "catalogEntryId": string;
  "catalogEntryName": string;
  "purchaseUnits": ChemtechShoppeV2_FinalPurchaseUnitDto[];
  "createdTime": string;
  "purchaseState": string;
  "source": string;
  "purchaseVisibility": string;
  "refundRule": string;
  "completedTime": string;
  "refund": ChemtechShoppeV2_RefundDto;
  "quantity": number;
}
export interface ChemtechShoppeV2_PurchaseRequestDto {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "idempotencyId": string;
  "quantity": number;
  "customInventoryLocation": string;
  "purchaserId": string;
  "source": string;
}
export interface ChemtechShoppeV2_PurchaseResponseDto {
  "data": ChemtechShoppeV2_PurchaseDto;
  "paging": ChemtechShoppeV2_PagingDto;
  "stats": ChemtechShoppeV2_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppeV2_PurchaseUnitDto {
  "paymentOptions": ChemtechShoppeV2_PaymentOptionDto[];
  "fulfillment": ChemtechShoppeV2_FulfillmentDto;
}
export interface ChemtechShoppeV2_PurchasesResponseDto {
  "data": ChemtechShoppeV2_PurchaseDto[];
  "paging": ChemtechShoppeV2_PagingDto;
  "stats": ChemtechShoppeV2_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppeV2_RefundDto {
  "id": string;
  "purchaseId": string;
  "createdTime": string;
  "state": string;
  "completedTime": string;
  "source": string;
}
export interface ChemtechShoppeV2_RefundRequestDto {
  "purchaseId": string;
  "source": string;
}
export interface ChemtechShoppeV2_RefundResponseDto {
  "data": ChemtechShoppeV2_RefundDto;
  "paging": ChemtechShoppeV2_PagingDto;
  "stats": ChemtechShoppeV2_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppeV2_RiotId {
  "gameName": string;
  "tagLine": string;
}
export interface ChemtechShoppeV2_RolledFulfillmentWrapperDto {
  "nodeId": string;
  "nodeName": string;
  "fulfillment": unknown;
}
export interface ChemtechShoppeV2_RotatingStoreMetadataDto {
  "slots": ChemtechShoppeV2_RotatingStoreSlotMetadataDto[];
  "currRotationStartTime": string;
  "nextRotationStartTime": string;
  "rotationCadence": string;
}
export interface ChemtechShoppeV2_RotatingStoreSlotMetadataDto {
  "selectionCount": number;
  "catalogEntryIds": string[];
}
export interface ChemtechShoppeV2_StatsDto {
  "durationMs": number;
}
export interface ChemtechShoppeV2_StoreDigestDto {
  "id": string;
  "productId": string;
  "name": string;
  "displayMetaData": unknown;
  "startTime": string;
  "endTime": string;
  "rotatingStoreMetadata": ChemtechShoppeV2_RotatingStoreMetadataDto;
}
export interface ChemtechShoppeV2_StoreDigestsDto {
  "digests": ChemtechShoppeV2_StoreDigestDto[];
}
export interface ChemtechShoppeV2_StoreDigestsResponseDto {
  "data": ChemtechShoppeV2_StoreDigestsDto;
  "paging": ChemtechShoppeV2_PagingDto;
  "stats": ChemtechShoppeV2_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppeV2_StoreDto {
  "id": string;
  "type": string;
  "productId": string;
  "name": string;
  "catalogEntries": ChemtechShoppeV2_CatalogEntryDto[];
  "displayMetadata": unknown;
  "startTime": string;
  "endTime": string;
  "rotatingStoreMetadata": ChemtechShoppeV2_RotatingStoreMetadataDto;
  "prerequisiteCatalogEntries": ChemtechShoppeV2_CatalogEntryDto[];
}
export interface ChemtechShoppeV2_StoresResponseDto {
  "data": ChemtechShoppeV2_StoreDto[];
  "paging": ChemtechShoppeV2_PagingDto;
  "stats": ChemtechShoppeV2_StatsDto;
  "notes": string[];
}
export interface ChemtechShoppeV2_SubPurchaseRequestDto {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "idempotencyId": string;
  "quantity": number;
  "customInventoryLocation": string;
}
export interface ChemtechShoppeV2_ValidRecipientDto {
  "puuid": string;
  "riotId": ChemtechShoppeV2_RiotId;
}
export interface ChemtechShoppeV2_VelocityLimitDeltaDto {
  "ruleId": string;
  "delta": number;
  "remaining": number;
}
export interface ClashEventData {
  "earnedDate": string;
  "rewardType": string;
  "tournamentId": number;
  "tournamentName": string;
  "tier": string;
  "bracket": number;
  "seasonId": number;
  "theme": string;
  "rosterId": number;
  "teamName": string;
  "teamShortName": string;
  "teamLogoName": string;
  "teamLogoChromaId": string;
  "playerUUIDs": string[];
  "rewardSpec": ClashRewardSpec;
}
export interface ClashOfflineNotification {
  "tournamentId": number;
  "reason": string;
  "metaData": Record<string, string>;
}
export interface ClashRewardConfigClient {
  "name": string;
  "keyDef": ClashRewardKeyType[];
  "entries": ClashRewardConfigEntry[];
}
export interface ClashRewardConfigEntry {
  "key": string;
  "vals": ClashRewardOutput[];
}
export interface ClashRewardDefinition {
  "rewardType": ClashRewardType;
  "rewardSpec": ClashRewardSpec;
}
export type ClashRewardKeyType = "CUP" | "LOWEST_POSITION" | "POINTS" | "SEASON_FLAG_COUNT" | "SEASON_VP" | "THEME_VP" | "TICKET_COUNT" | "TICKET_TYPE" | "TIER" | "TOC_STATE" | "TOURNAMENT_WIN_POS" | "WINS";
export interface ClashRewardOutput {
  "primary": ClashRewardDefinition;
  "alternative": ClashRewardDefinition;
  "grant": ClashRewardTime;
  "show": ClashRewardTime;
}
export interface ClashRewardSpec {
  "pedestal": string;
  "cup": string;
  "gem": string;
  "tier": string;
  "bracket": string;
  "theme": string;
  "level": string;
  "seasonId": string;
  "name": string;
  "quantity": string;
}
export type ClashRewardTime = "EOB" | "EOG" | "EOT" | "NONE";
export type ClashRewardType = "FLAG" | "FRAME" | "LOGO" | "LOOT" | "TOC" | "TROPHY" | "VP";
export interface ClashSeasonRewardResult {
  "playerId": number;
  "seasonId": number;
  "seasonVp": number;
  "banned": boolean;
  "honorLevel": number;
  "eligible": boolean;
  "rewards": ClashRewardDefinition[];
}
export type ClientBracketMatchStatus = "COMPLETED" | "STARTED" | "UPCOMING";
export interface ClientConfigAuthenticatedConnection {
  "connectionId": number;
  "subscribed": boolean;
  "authToken": string;
}
export interface ClientConfigBuildInfo {
  "contentBuildId": number;
  "codeBuildId": number;
  "gameDataBuildId": number;
  "branch": string;
  "branchFull": string;
  "gameBranch": string;
  "gameBranchFull": string;
  "patchline": string;
  "version": string;
  "patchlineVisibleName": string;
}
export interface ClientConfigClientConfig {
  "params": ClientConfigConfigParams;
  "data": Record<string, unknown>;
  "updateTime": number;
}
export interface ClientConfigConfigNamespaceUpdate {
  "public": string[];
  "player": string[];
}
export interface ClientConfigConfigParams {
  "type": ClientConfigConfigType;
  "appName": string;
  "version": string;
  "patchline": string;
  "region": string;
  "namespace": string;
}
export type ClientConfigConfigReadinessEnum = "Disabled" | "NotReady" | "Ready";
export interface ClientConfigConfigStatus {
  "readiness": ClientConfigConfigReadinessEnum;
  "updateId": number;
}
export type ClientConfigConfigType = "player" | "public";
export interface ClientConfigDataPaths {
  "userDataRoot": string;
  "configRoot": string;
  "dataRoot": string;
  "localSettingsPath": string;
  "privateSettingsPath": string;
}
export interface ClientConfigDepInjectorEntitlements {
  "accessToken": string;
  "token": string;
  "subject": string;
  "issuer": string;
  "entitlements": string[];
}
export interface ClientConfigDepInjectorEntitlementsUpdate {
  "EntitlementsUpdateType": ClientConfigDepInjectorEntitlementsUpdateType;
  "EntitlementsTokenResource": ClientConfigDepInjectorEntitlements;
}
export type ClientConfigDepInjectorEntitlementsUpdateType = "Create" | "Delete" | "Update";
export interface ClientConfigEntitlements {
  "accessToken": string;
  "token": string;
  "subject": string;
  "issuer": string;
  "entitlements": string[];
}
export interface ClientConfigEntitlementsUpdate {
  "UpdateType": ClientConfigUpdateType;
  "EntitlementsTokenResource": ClientConfigEntitlements;
}
export interface ClientConfigSession {
  "productId": string;
  "patchlineId": string;
  "version": string;
  "isInternal": boolean;
  "connections": ClientConfigAuthenticatedConnection[];
}
export type ClientConfigUpdateType = "Create" | "Delete" | "Update";
export type ClientRequestError = "ALREADY_DECLINED" | "ALREADY_DECLINE_WITHDRAW" | "ALREADY_INVITED" | "ALREADY_IN_GAME" | "ALREADY_IN_PHASE" | "ALREADY_MEMBER" | "ALREADY_SUGGESTED" | "ALREADY_VOTE_WITHDRAW" | "CAPTAIN_NOT_ALLOWED" | "CLASH_BANNED" | "CLASH_BANNED_INVITEE" | "ELIGIBILITY_SERVER_ERROR" | "FAIL_INVITE" | "FAIL_SUGGESTINVITE" | "HONOR_INELIGIBILITY" | "INACTIVE_PHASE" | "INACTIVE_REGISTRATION" | "INTERNAL_ERROR" | "INVALID_BRACKET" | "INVALID_BUY_BACK" | "INVALID_CHECKELIGIBILITY_SIZE" | "INVALID_INVITEE" | "INVALID_LOGO" | "INVALID_LOGOCOLOR" | "INVALID_MATCHID" | "INVALID_MATCHSTATUS_FORGAMEEND" | "INVALID_NAME" | "INVALID_PHASE" | "INVALID_PLAYER" | "INVALID_POSITION" | "INVALID_REWARD_CONFIG_NAME" | "INVALID_ROSTER" | "INVALID_ROSTER_MEMBER_SIZE" | "INVALID_SEASON" | "INVALID_SHORTNAME" | "INVALID_TOURNAMENT" | "INVALID_Tier" | "INVALID_WITHDRAW" | "IN_OTHER_PENDINGROSTER" | "IN_OTHER_PHASE_OF_PERIOD" | "IN_OTHER_ROSTER" | "LOGOCOLOR_NOT_ALLOWED" | "LOGO_NOT_ALLOWED" | "MAX_INVITED" | "MAX_ROSTER_FETCHSIZE" | "NOT_ALLOWED_DELETE_TOURNAMENT" | "NOT_ALLOWED_DELETE_TOURNAMENT_REWARD_CONFIG" | "NOT_CAPTAIN" | "NOT_ENOUGH_TICKETS" | "NOT_INVITEE" | "NOT_MEMBER" | "NOT_SEED_INTO_LEAGUE" | "NO_AVAILABLE_PHASE" | "NO_MORE_RECOMMEND" | "NO_PERMISSION" | "NO_SAME_PLAYER" | "OVER_INVITE" | "OVER_SUGGESTION_INVITE" | "PENDING_ROSTER_CLOSE" | "PENDING_ROSTER_FULL" | "PENDING_ROSTER_NOT_READY" | "PHASE_CANCELLED" | "PHASE_FULL" | "ROSTER_DISBAND_NOT_ALLOWED" | "ROSTER_ELIMINATED" | "SMS_NOT_VERIFIED" | "SUGGEST_INVITEE_NOT_EXIST" | "SUMMONER_LEVEL_REQUIREMENT_NOT_MET" | "TICKET_ALREADY_SET" | "TICKET_NOT_SET" | "TICKET_OFFER_INVALID_COUNT" | "TICKET_OFFER_NOT_EXIST" | "VOICE_NOT_AVAILABLE" | "WITHDRAW_CANCEL_NOT_ALLOWED" | "WITHDRAW_LOCKOUT" | "WITHDRAW_NOT_ALLOWED";
export interface CollectionsLcdsChampionDTO {
  "endDate": number;
  "purchaseDate": number;
  "winCountRemaining": number;
  "sources": string[];
  "active": boolean;
  "botEnabled": boolean;
  "championId": number;
  "championSkins": CollectionsLcdsChampionSkinDTO[];
  "freeToPlay": boolean;
  "freeToPlayReward": boolean;
  "f2pRewardSources": string[];
  "owned": boolean;
  "purchased": number;
  "rankedPlayEnabled": boolean;
}
export interface CollectionsLcdsChampionSkinDTO {
  "endDate": number;
  "purchaseDate": number;
  "winCountRemaining": number;
  "sources": string[];
  "championId": number;
  "freeToPlayReward": boolean;
  "f2pRewardSources": string[];
  "lastSelected": boolean;
  "owned": boolean;
  "skinId": number;
  "stillObtainable": boolean;
}
export interface CollectionsLcdsRentalUpdateNotification {
  "inventoryType": string;
  "data": unknown;
}
export interface CollectionsLcdsStoreFulfillmentNotification {
  "inventoryType": string;
  "data": unknown;
}
export interface ContentItemIdentifier {
  "itemId": number;
  "inventoryType": string;
}
export interface CraftLootDTO {
  "recipeName": string;
  "lootNames": string[];
  "repeat": number;
}
export interface CraftLootRefTransactionDTO {
  "clientId": string;
  "transactionId": string;
  "recipeName": string;
  "lootNameRefIds": LootNameRefId[];
  "repeat": number;
}
export interface CrashReportingEnvironment {
  "environment": string;
  "userName": string;
  "userId": string;
}
export interface CriticalFlowCapture {
  "timestampInUs": number;
  "expected": boolean;
  "succeeded": boolean;
  "idChain": string;
  "qualifierChain": string;
  "payloadString": string;
}
export interface CriticalFlowExpectation {
  "idChain": string;
  "qualifierChain": string;
}
export interface CriticalFlowSummary {
  "activeFlows": string[];
  "activeFlowEvents": CriticalFlowExpectation[];
  "events": CriticalFlowCapture[];
  "errors": string[];
}
export interface DeepLinksClientConfigDeepLinksValue {
  "launchLorEnabled": boolean;
  "launchLorUrl": string;
}
export interface DeepLinksDeepLinksSettings {
  "isSchemeReady": boolean;
  "externalClientScheme": string;
  "launchLorEnabled": boolean;
  "launchLorUrl": string;
}
export interface DownloadUrlRequestV2 {
  "platformId": string;
  "gameId": number;
}
export interface DownloadUrlResponseV2 {
  "url": string;
}
export type ElevationAction = "FixBrokenPermissions";
export interface ElevationRequest {
  "action": ElevationAction;
}
export interface EndOfGameLcdsEndOfGameStats {
  "difficulty": string;
  "gameId": number;
  "gameLength": number;
  "endOfGameTimestamp": number;
  "gameMode": string;
  "gameMutators": string[];
  "gameType": string;
  "invalid": boolean;
  "queueType": string;
  "ranked": boolean;
  "reportGameId": number;
  "roomName": string;
  "roomPassword": string;
  "mucJwtDto": MucJwtDto;
  "myTeamInfo": EndOfGameLcdsTeamInfo;
  "otherTeamInfo": EndOfGameLcdsTeamInfo;
  "teamPlayerParticipantStats": EndOfGameLcdsPlayerParticipantStatsSummary[];
  "otherTeamPlayerParticipantStats": EndOfGameLcdsPlayerParticipantStatsSummary[];
  "myTeamStatus": string;
  "leveledUp": boolean;
  "newSpells": EndOfGameLcdsSpell[];
  "previousLevel": number;
  "rpEarned": number;
  "skinIndex": number;
  "skinId": number;
  "summonerName": string;
  "riotIdGameName": string;
  "riotIdTagLine": string;
  "userId": number;
  "basePoints": number;
  "battleBoostIpEarned": number;
  "boostIpEarned": number;
  "firstWinBonus": number;
  "ipEarned": number;
  "ipTotal": number;
  "boostXpEarned": number;
  "experienceEarned": number;
  "experienceTotal": number;
  "loyaltyBoostXpEarned": number;
  "previousXpTotal": number;
  "timeUntilNextFirstWinBonus": number;
  "causedEarlySurrender": boolean;
  "earlySurrenderAccomplice": boolean;
  "teamEarlySurrendered": boolean;
  "gameEndedInEarlySurrender": boolean;
}
export interface EndOfGameLcdsHarassmentReport {
  "gameId": number;
  "reportSource": string;
  "reportingSummonerId": number;
  "reportedSummonerId": number;
  "offense": string;
  "comment": string;
}
export interface EndOfGameLcdsPlayerParticipantStatsSummary {
  "puuid": string;
  "level": number;
  "userId": number;
  "teamId": number;
  "gameId": number;
  "leaver": boolean;
  "summonerName": string;
  "riotIdGameName": string;
  "riotIdTagLine": string;
  "skinName": string;
  "profileIconId": number;
  "wins": number;
  "leaves": number;
  "losses": number;
  "botPlayer": boolean;
  "spell1Id": number;
  "spell2Id": number;
  "championId": number;
  "skinIndex": number;
  "selectedPosition": string;
  "detectedTeamPosition": string;
  "statistics": EndOfGameLcdsRawStatDTO[];
}
export interface EndOfGameLcdsPointsPenalty {
  "type": string;
  "penalty": number;
}
export interface EndOfGameLcdsRawStatDTO {
  "value": number;
  "statTypeName": string;
}
export interface EndOfGameLcdsSpell {
  "spellId": number;
}
export interface EndOfGameLcdsTeamId {
  "fullId": string;
}
export interface EndOfGameLcdsTeamInfo {
  "teamId": EndOfGameLcdsTeamId;
  "name": string;
  "tag": string;
  "secondsUntilEligibleForDeletion": number;
  "memberStatusString": string;
}
export interface EntitlementsToken {
  "accessToken": string;
  "token": string;
  "subject": string;
  "issuer": string;
  "entitlements": string[];
}
export interface EogLcdsGameDTO {
  "id": number;
  "gameState": string;
  "teamOne": PlayerParticipant[];
  "teamTwo": PlayerParticipant[];
  "bannedChampions": BannedChampion[];
}
export interface ErrorMonitorLogBatch {
  "logType": ErrorMonitorLogType;
  "logEntries": LogEntry[];
}
export type ErrorMonitorLogType = "FOUNDATION" | "UX";
export type ExternalPluginsAvailability = "Connected" | "Error" | "NotAvailable" | "Preparing" | "Recovering";
export interface ExternalPluginsResource {
  "state": ExternalPluginsAvailability;
  "errorString": string;
}
export interface FailedInvite {
  "playerId": number;
  "exception": ClientRequestError;
}
export type GameQueuesLcdsAllowSpectators = "ALL" | "DROPINONLY" | "LOBBYONLY" | "NONE";
export interface GameQueuesLcdsGameQueueConfig {
  "disallowFreeChampions": boolean;
  "gameMode": string;
  "gameMutators": string[];
  "gameTypeConfigId": number;
  "id": number;
  "mapId": number;
  "maximumParticipantListSize": number;
  "minLevel": number;
  "minimumParticipantListSize": number;
  "numPlayersPerTeam": number;
  "queueState": string;
  "ranked": boolean;
  "supportedMapIds": number[];
  "type": string;
  "lastToggledOffTime": number;
  "lastToggledOnTime": number;
  "removalFromGameAllowed": boolean;
  "removalFromGameDelayMinutes": number;
  "custom": boolean;
  "numberOfTeamsInLobby": number;
  "maxLobbySpectatorCount": number;
  "teamVoiceEnabled": boolean;
}
export interface GameflowLcdsGameDTO {
  "id": number;
  "mapId": number;
  "gameState": string;
  "queueTypeName": string;
  "gameMode": string;
  "gameTypeConfigId": number;
  "maxNumPlayers": number;
  "gameType": string;
  "spectatorDelay": number;
  "gameQueueConfigId": number;
  "teamOne": unknown[];
  "teamTwo": unknown[];
  "playerChampionSelections": unknown[];
}
export interface GameflowLcdsPlayerCredentialsDto {
  "gameId": number;
  "serverIp": string;
  "serverPort": number;
  "encryptionKey": string;
  "observer": boolean;
  "observerServerIp": string;
  "observerServerPort": number;
  "observerEncryptionKey": string;
  "summonerId": number;
  "packetCopMetadata": string;
  "spectatorKey": string;
  "puuid": string;
  "tvJwt": string;
}
export interface GameflowLcdsReconnectInfoDto {
  "playerCredentials": GameflowLcdsPlayerCredentialsDto;
  "game": GameflowLcdsGameDTO;
  "reconnectDelay": number;
}
export interface IdsDTO {
  "missionIds": string[];
  "seriesIds": string[];
}
export type InviteType = "FREEAGENT" | "FRIEND" | "NONE" | "SELFJOIN" | "SUGGEST";
export interface LcdsAcceptGameInvitationRequestDto {
  "invitationId": string;
  "gameVersion": string;
  "champSelectInventoryJwt": string;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LcdsBotParticipant {
  "summonerId": number;
  "summonerName": string;
  "summonerInternalName": string;
  "botSkillLevel": number;
  "botDifficulty": string;
  "position": string;
  "botUuid": string;
  "teamId": string;
}
export interface LcdsCreatePracticeGameRequestDto {
  "practiceGameConfig": LcdsPracticeGameConfig;
  "simpleInventoryJwt": string;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LcdsFailedJoinPlayer {
  "summoner": LcdsSummoner;
  "reasonFailed": string;
}
export interface LcdsGameDTO {
  "id": number;
  "name": string;
  "mapId": number;
  "gameTypeConfigId": number;
  "gameType": string;
  "gameMode": string;
  "maxNumPlayers": number;
  "spectatorsAllowed": string;
  "ownerSummary": LcdsPlayerParticipant;
  "teamOne": LcdsPlayerParticipant[];
  "teamTwo": LcdsPlayerParticipant[];
  "observers": LcdsPlayerParticipant[];
  "practiceGameRewardsDisabledReasons": string[];
  "gameMutators": string[];
  "roomName": string;
  "roomPassword": string;
  "mucJwtDto": MucJwtDto;
  "passbackUrl": string;
  "passbackDataPacket": string;
  "optimisticLock": number;
  "gameState": string;
}
export interface LcdsGameInviteBaseRuntimeException {
  "rootCauseClassname": string;
}
export interface LcdsGameMap {
  "mapId": number;
  "name": string;
  "displayName": string;
  "description": string;
  "minCustomPlayers": number;
  "totalPlayers": number;
}
export interface LcdsGameNotification {
  "type": string;
  "messageCode": string;
  "messageArgument": string;
}
export interface LcdsInvitationRequest {
  "invitationId": string;
  "owner": LcdsPlayer;
  "inviter": LcdsInviter;
  "invitationState": LcdsInvitationState;
  "gameMetaData": string;
  "inviteType": string;
  "invitePayload": string;
}
export type LcdsInvitationState = "ACTIVE" | "ON_HOLD" | "REVOKED";
export interface LcdsInviteFailed {
  "summonerId": number;
  "summonerName": string;
  "exception": LcdsGameInviteBaseRuntimeException;
}
export interface LcdsInvitePrivileges {
  "canInvite": boolean;
}
export interface LcdsInvitee {
  "summonerId": number;
  "summonerName": string;
  "inviteeState": LcdsInviteeState;
}
export type LcdsInviteeState = "ACCEPTED" | "ACCEPT_FAILED" | "BANNED" | "CREATOR" | "DECLINED" | "JOINED" | "KICKED" | "PENDING" | "QUIT";
export interface LcdsInviter {
  "summonerId": number;
  "summonerName": string;
  "previousSeasonHighestTier": string;
}
export interface LcdsJoinGameRequestDto {
  "gameId": number;
  "password"?: string;
  "gameVersion": string;
  "simpleInventoryJwt": string;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LcdsJoinOrCreatePracticeGameRequestDto {
  "practiceGameConfig": LcdsPracticeGameConfig;
  "simpleInventoryJwt": string;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LcdsLobbyStatus {
  "invitationId": string;
  "owner": LcdsPlayer;
  "chatKey": string;
  "members": LcdsMember[];
  "invitees": LcdsInvitee[];
  "gameMetaData": string;
}
export interface LcdsMember {
  "summonerId": number;
  "summonerName": string;
  "hasDelegatedInvitePower": boolean;
}
export interface LcdsObserveGameRequestDto {
  "gameId": number;
  "password"?: string;
  "gameVersion": string;
  "champSelectInventoryJwt": string;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LcdsPayloadDto {
  "method": string;
  "headers": Record<string, string>;
  "path": string;
  "body": string;
}
export interface LcdsPlayer {
  "summonerId": number;
  "summonerName": string;
}
export interface LcdsPlayerGcoTokens {
  "summonerToken": string;
  "userInfoJwt": string;
  "entitlementsToken": string;
}
export interface LcdsPlayerParticipant {
  "summonerId": number;
  "summonerName": string;
  "summonerInternalName": string;
  "botSkillLevel": number;
  "botDifficulty": string;
  "position": string;
  "botUuid": string;
}
export interface LcdsPracticeGameConfig {
  "gameName": string;
  "gameMode": string;
  "gameMap": LcdsGameMap;
  "maxNumPlayers": number;
  "gameTypeConfig": number;
  "gamePassword": string;
  "allowSpectators": string;
  "passbackUrl"?: string;
  "passbackDataPacket"?: string;
  "gameMutators": string[];
  "region": string;
  "gameVersion": string;
  "spectatorDelayEnabled": boolean;
}
export interface LcdsPracticeGameSearchResult {
  "id": number;
  "name": string;
  "owner": LcdsPlayerParticipant;
  "maxNumPlayers": number;
  "privateGame": boolean;
  "team1Count": number;
  "team2Count": number;
  "spectatorCount": number;
  "gameMap": LcdsGameMap;
  "gameMapId": number;
  "gameMode": string;
  "pickType": string;
  "allowSpectators": string;
}
export type LcdsRemovalReason = "DESTROYED" | "KICKED" | "PROGRESSED";
export interface LcdsRemovedFromLobbyNotification {
  "removalReason": LcdsRemovalReason;
}
export interface LcdsStartChampSelectDto {
  "invalidPlayers": LcdsFailedJoinPlayer[];
}
export interface LcdsSummoner {
  "sumId": number;
  "name": string;
}
export interface LcdsSwitchObserverToPlayerRequestDto {
  "gameId": number;
  "teamId": number;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LcdsSwitchPlayerToObserverRequestDto {
  "gameId": number;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LcdsSwitchTeamsRequestDto {
  "gameId": number;
  "playerGcoTokens": LcdsPlayerGcoTokens;
}
export interface LogEntry {
  "severity": LogSeverityLevels;
  "message": string;
}
export interface LogEvent {
  "severity": LogSeverityLevels;
  "message": string;
}
export type LogSeverityLevels = "Always" | "Error" | "Okay" | "Warning";
export interface LolAccountVerificationAVSConfig {
  "Enabled": boolean;
  "DisableGetActivePhoneNumberCall": boolean;
}
export interface LolAccountVerificationConfirmActivationPinRequest {
  "oneTimePin": string;
}
export interface LolAccountVerificationConfirmActivationPinResponse {
  "data": LolAccountVerificationPinResponseData;
  "clientMessageId": string;
}
export interface LolAccountVerificationConfirmDeactivationPinRequest {
  "oneTimePin": string;
}
export interface LolAccountVerificationConfirmDeactivationPinResponse {
  "data": LolAccountVerificationPinResponseData;
  "clientMessageId": string;
}
export interface LolAccountVerificationIsVerifiedResponse {
  "success": boolean;
  "message": string;
  "status": number;
}
export interface LolAccountVerificationLoginSession {
  "state": LolAccountVerificationLoginSessionState;
  "summonerId": number;
  "accountId": number;
  "username": string;
}
export type LolAccountVerificationLoginSessionState = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolAccountVerificationPhoneNumberObfuscated {
  "countryCode": string;
  "endsWith": string;
  "length": number;
}
export interface LolAccountVerificationPhoneNumberResponse {
  "data": LolAccountVerificationPhoneNumberResponseData;
  "error": LolAccountVerificationResponseError;
  "clientMessageId": string;
}
export interface LolAccountVerificationPhoneNumberResponseData {
  "phoneNumberObfuscated": LolAccountVerificationPhoneNumberObfuscated;
}
export interface LolAccountVerificationPinResponseData {
  "status": string;
}
export interface LolAccountVerificationResponseError {
  "errorCode": string;
  "message": string;
}
export interface LolAccountVerificationSendActivationPinRequest {
  "phoneNumber": string;
  "locale": string;
}
export interface LolAccountVerificationSendActivationPinResponse {
  "data": LolAccountVerificationSendActivationPinResponseData;
  "error": LolAccountVerificationResponseError;
  "clientMessageId": string;
}
export interface LolAccountVerificationSendActivationPinResponseData {
  "pinExpiresAtEpochMillis": number;
}
export interface LolAccountVerificationSendDeactivationPinRequest {
  "locale": string;
}
export interface LolAccountVerificationSendDeactivationPinResponse {
  "data": LolAccountVerificationSendActivationPinResponseData;
  "error": LolAccountVerificationResponseError;
  "clientMessageId": string;
}
export interface LolActiveBoostsActiveBoosts {
  "xpBoostEndDate": string;
  "xpBoostPerWinCount": number;
  "xpLoyaltyBoost": number;
  "firstWinOfTheDayStartTime": string;
}
export interface LolActiveBoostsEndOfGameStats {
  "timeUntilNextFirstWinBonus": number;
}
export interface LolActiveBoostsInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolActiveBoostsItemOwnershipType;
  "expirationDate": string;
  "wins": number;
}
export interface LolActiveBoostsInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "ownedQuantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "payload": unknown;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "lsb": boolean;
  "wins": number;
}
export interface LolActiveBoostsInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolActiveBoostsItemOwnershipType;
  "expirationDate": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "owned": boolean;
  "wins": number;
  "payload": unknown;
}
export type LolActiveBoostsItemOwnershipType = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolActiveBoostsLoyaltyRewardsSimplified {
  "xpBoost": number;
}
export type LolActiveBoostsLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolActiveBoostsLoyaltyStatusNotification {
  "status": LolActiveBoostsLoyaltyStatus;
  "rewards": LolActiveBoostsLoyaltyRewardsSimplified;
}
export interface LolActivityCenterConfigData {
  "puuid": string;
  "sessionId": string;
  "region": string;
  "locale": string;
  "webRegion": string;
  "webLocale": string;
  "publishingLocale": string;
  "rsoPlatformId": string;
  "enabled": boolean;
  "clientNavEnabled": boolean;
}
export interface LolActivityCenterLoginSession {
  "state": LolActivityCenterLoginSessionStates;
  "summonerId": number;
  "puuid": string;
  "connected": boolean;
}
export type LolActivityCenterLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolActivityCenterPublishingSettings {
  "region": string;
  "locale": string;
  "webRegion": string;
  "webLocale": string;
  "publishingLocale": string;
  "rsoPlatformId": string;
}
export interface LolActivityCenterTencentOverrides {
  "infoHubAlternativeExperienceUrl": string;
  "activityCenterAlternativeExperienceUrl": string;
}
export interface LolBannersBannerFlag {
  "itemId": number;
  "theme": string;
  "level": number;
  "seasonId": number;
  "earnedDateIso8601": string;
}
export interface LolBannersBannerFrame {
  "level": number;
}
export interface LolBannersCapClashFlagEntitlementPayload {
  "rewardSpec": LolBannersClashV2FlagRewardSpec;
  "rewardType": string;
}
export interface LolBannersCapClashFrameEntitlementPayload {
  "rewardSpec": LolBannersClashV2FrameRewardSpec;
  "rewardType": string;
}
export interface LolBannersClashV2FlagRewardSpec {
  "theme": string;
  "level": string;
  "seasonId": string;
}
export interface LolBannersClashV2FrameRewardSpec {
  "level": string;
  "seasonId": string;
}
export interface LolBannersInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "payload": unknown;
}
export interface LolBannersInventoryItemsByType {
  "TOURNAMENT_FLAG": LolBannersTournamentFlagInventoryItem[];
  "TOURNAMENT_FRAME": LolBannersTournamentFrameInventoryItem[];
}
export interface LolBannersInventoryResponse {
  "items": LolBannersInventoryItemsByType;
}
export interface LolBannersLoadout {
  "id": string;
  "name": string;
  "scope": string;
  "loadout": Record<string, LolBannersLoadoutsSlot>;
}
export interface LolBannersLoadoutsSlot {
  "itemId": number;
  "inventoryType": string;
}
export interface LolBannersSummonerProfileUpdate {
  "key": string;
  "value": unknown;
}
export interface LolBannersTournamentFlagInventoryItem {
  "itemId": number;
  "payload": LolBannersCapClashFlagEntitlementPayload;
  "purchaseDate": string;
}
export interface LolBannersTournamentFrameInventoryItem {
  "payload": LolBannersCapClashFrameEntitlementPayload;
  "purchaseDate": string;
}
export interface LolCapMissionsCapMissionSeries {
  "name": string;
  "configurationId": string;
  "missions": LolCapMissionsCapMissionSeriesMission[];
}
export interface LolCapMissionsCapMissionSeriesMission {
  "name": string;
  "missionId": string;
  "expression": string;
  "missionCollectionId": string;
  "status": string;
  "completedTimeUtc": string;
  "missionInstanceId": string;
  "objectives": LolCapMissionsCapMissionSeriesMissionObjective[];
  "eligibility": LolCapMissionsCapMissionSeriesMissionEligibility[];
  "rewardsStatus": LolCapMissionsCapMissionSeriesMissionRewardsStatus;
  "repeatSequence": number;
  "properties": Record<string, string>;
  "metadata": Record<string, string>;
}
export interface LolCapMissionsCapMissionSeriesMissionEligibility {
  "type": string;
  "missionCollectionId": string;
  "missionId": string;
  "startTime": string;
}
export interface LolCapMissionsCapMissionSeriesMissionObjective {
  "statId": string;
  "objectiveId": string;
  "goal": number;
  "currentValue": number;
}
export interface LolCapMissionsCapMissionSeriesMissionReward {
  "type": string;
  "counterId": string;
  "itemId": string;
  "itemTypeId": string;
  "typeId": string;
  "currencyId": string;
  "amount": number;
  "quantity": number;
}
export interface LolCapMissionsCapMissionSeriesMissionRewardsStatus {
  "requiresClaim": boolean;
  "status": string;
  "rewards": LolCapMissionsCapMissionSeriesMissionReward[];
}
export interface LolCapMissionsCapMissionsMarkAsViewedPostBody {
  "events": LolCapMissionsCapMissionsMarkAsViewedPostBodyEvent[];
}
export interface LolCapMissionsCapMissionsMarkAsViewedPostBodyEvent {
  "configurationId": string;
  "missions": LolCapMissionsCapMissionsMarkAsViewedPostBodyMission[];
}
export interface LolCapMissionsCapMissionsMarkAsViewedPostBodyMission {
  "missionInstanceId": string;
  "metadata": Record<string, string>;
}
export interface LolCapMissionsCapMissionsMeResponse {
  "productId": string;
  "ownerId": string;
  "series": LolCapMissionsCapMissionSeries[];
}
export interface LolCapMissionsLoginSession {
  "state": LolCapMissionsLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
}
export type LolCapMissionsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolCapMissionsRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolCapMissionsRiotMessagingServicePayload {
  "deltaEventId": string;
  "ownerId": string;
  "updatedMissions": string[];
}
export interface LolCatalogBundled {
  "flexible": boolean;
  "items": LolCatalogBundledItem[];
  "minimumPrices": LolCatalogBundledItemCost[];
}
export interface LolCatalogBundledItem {
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
  "discountPrices": LolCatalogBundledItemCost[];
}
export interface LolCatalogBundledItemCost {
  "currency": string;
  "cost": number;
  "discount"?: number;
  "costType": string;
}
export interface LolCatalogCatalogItem {
  "itemId": number;
  "itemInstanceId": string;
  "active": boolean;
  "inventoryType": string;
  "inactiveDate": string;
  "maxQuantity": number;
  "prices": LolCatalogItemCost[];
  "releaseDate": string;
  "sale"?: LolCatalogSale;
  "duration"?: number;
  "subInventoryType"?: string;
  "tags"?: string[];
  "iconUrl": string;
  "localizations": Record<string, LolCatalogItemLocalization>;
  "bundled"?: LolCatalogBundled;
  "itemRequirements"?: LolCatalogItemKey[];
  "metadata"?: LolCatalogItemMetadataEntry[];
  "offerId"?: string;
}
export interface LolCatalogCatalogPluginItem {
  "itemId": number;
  "itemInstanceId": string;
  "owned": boolean;
  "ownershipType"?: LolCatalogInventoryOwnership;
  "inventoryType": string;
  "subInventoryType": string;
  "name": string;
  "subTitle": string;
  "description": string;
  "imagePath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "rarity": string;
  "taggedChampionsIds": number[];
  "purchaseDate": number;
  "releaseDate": number;
  "inactiveDate": number;
  "maxQuantity": number;
  "prices": LolCatalogCatalogPluginPrice[];
  "tags"?: string[];
  "metadata"?: LolCatalogItemMetadataEntry[];
  "active": boolean;
  "sale"?: LolCatalogSale;
  "duration": number;
  "questSkinInfo"?: LolCatalogSkinLineInfo;
  "offerId"?: string;
}
export interface LolCatalogCatalogPluginItemAssets {
  "splashPath": string;
  "iconPath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "previewVideoUrl": string;
  "emblems": LolCatalogChampionSkinEmblem[];
  "colors": string[];
}
export interface LolCatalogCatalogPluginItemWithDetails {
  "item": LolCatalogCatalogPluginItem;
  "quantity": number;
  "requiredItems"?: LolCatalogCatalogPluginItemWithDetails[];
  "bundledItems"?: LolCatalogCatalogPluginItemWithDetails[];
  "minimumBundlePrices"?: LolCatalogCatalogPluginPrice[];
  "bundledDiscountPrices"?: LolCatalogCatalogPluginPrice[];
  "assets": LolCatalogCatalogPluginItemAssets;
  "metadata": LolCatalogItemMetadataEntry[];
  "bundleFinalPrice": number;
  "flexible": boolean;
}
export interface LolCatalogCatalogPluginPrice {
  "currency": string;
  "cost": number;
  "costType"?: string;
  "sale"?: LolCatalogCatalogPluginRetailDiscount;
}
export interface LolCatalogCatalogPluginRetailDiscount {
  "startDate": string;
  "endDate": string;
  "discount"?: number;
  "cost": number;
}
export interface LolCatalogChampionSkinEmblem {
  "name": string;
  "emblemPath": LolCatalogChampionSkinEmblemPath;
  "emblemPosition": LolCatalogChampionSkinEmblemPosition;
}
export interface LolCatalogChampionSkinEmblemPath {
  "large": string;
  "small": string;
}
export interface LolCatalogChampionSkinEmblemPosition {
  "vertical": string;
  "horizontal": string;
}
export interface LolCatalogGameDataChampion {
  "skins": LolCatalogGameDataChampionSkin[];
}
export interface LolCatalogGameDataChampionChroma {
  "id": number;
  "name": string;
  "chromaPath": string;
  "colors": string[];
}
export interface LolCatalogGameDataChampionSkin {
  "id": number;
  "name": string;
  "splashPath": string;
  "chromas": LolCatalogGameDataChampionChroma[];
  "emblems": LolCatalogChampionSkinEmblem[];
  "uncenteredSplashPath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "rarity": string;
  "previewVideoUrl": string;
  "chromaPath": string;
  "questSkinInfo"?: LolCatalogSkinLineInfo;
  "colors": string[];
}
export interface LolCatalogGameDataChampionSummary {
  "id": number;
  "name": string;
  "squarePortraitPath": string;
  "skins": LolCatalogGameDataChampionSkin[];
}
export interface LolCatalogGameDataEventPass {
  "itemId": number;
  "name": string;
  "description": string;
  "image": string;
  "passType": string;
  "contentId": string;
}
export interface LolCatalogGameDataItemReference {
  "itemId": number;
  "inventoryType": string;
  "contentId": string;
}
export interface LolCatalogGameDataRegaliaBanner {
  "id": string;
  "idSecondary": string;
  "assetPath": string;
  "localizedName": string;
}
export interface LolCatalogGameDataSkinAugment {
  "itemId": number;
  "capType": string;
  "image": string;
}
export interface LolCatalogGameDataStatstone {
  "name": string;
  "contentId": string;
  "itemId": number;
  "isRetired": boolean;
  "isDuration": boolean;
  "isEpic": boolean;
  "category": string;
  "description": string;
  "iconFull": string;
}
export interface LolCatalogGameDataStatstonePack {
  "name": string;
  "description": string;
  "itemId": number;
  "contentId": string;
}
export interface LolCatalogGameDataStatstoneSet {
  "name": string;
  "statstones": LolCatalogGameDataStatstone[];
}
export interface LolCatalogGameDataStatstonesInfo {
  "statstoneData": LolCatalogGameDataStatstoneSet[];
  "packData": LolCatalogGameDataStatstonePack[];
  "packIdToStatStonesIds": unknown;
  "seriesIdToStatStoneIds": unknown;
  "packIdToSubPackIds": unknown;
  "collectionIdToStatStoneIds": unknown;
  "packIdToChampIds": unknown;
  "champIdToPackIds": unknown;
}
export interface LolCatalogGameDataSummonerEmote {
  "id": number;
  "name": string;
  "inventoryIcon": string;
  "description": string;
  "taggedChampionsIds": number[];
}
export interface LolCatalogGameDataSummonerIcon {
  "id": number;
  "title": string;
  "imagePath": string;
}
export interface LolCatalogGameDataWardSkin {
  "id": number;
  "name": string;
  "description": string;
  "wardImagePath": string;
}
export interface LolCatalogInventoryContent {
  "itemId": number;
  "ownershipType": LolCatalogInventoryOwnership;
  "purchaseDate": string;
}
export type LolCatalogInventoryOwnership = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolCatalogItemChoiceDetails {
  "item": LolCatalogCatalogPluginItem;
  "backgroundImage": string;
  "contents": LolCatalogItemDetails[];
  "discount": string;
  "fullPrice": number;
  "displayType": string;
  "metadata": unknown;
}
export interface LolCatalogItemCost {
  "currency": string;
  "cost": number;
  "discount"?: number;
}
export interface LolCatalogItemDetails {
  "title": string;
  "subTitle": string;
  "description": string;
  "iconUrl": string;
}
export interface LolCatalogItemKey {
  "inventoryType": string;
  "itemId": number;
}
export interface LolCatalogItemLocalization {
  "language": string;
  "name": string;
  "description": string;
}
export interface LolCatalogItemMetadataEntry {
  "type": string;
  "value": string;
}
export interface LolCatalogSale {
  "startDate": string;
  "endDate": string;
  "prices": LolCatalogItemCost[];
}
export interface LolCatalogSkinLineDescriptionInfo {
  "title": string;
  "description": string;
  "iconPath": string;
}
export interface LolCatalogSkinLineInfo {
  "name": string;
  "descriptionInfo": LolCatalogSkinLineDescriptionInfo[];
  "splashPath": string;
  "tilePath": string;
  "collectionCardPath": string;
  "uncenteredSplashPath": string;
  "collectionDescription": string;
  "tiers": LolCatalogSkinLineTier[];
  "mostProgressedSkinTier": LolCatalogSkinLineTier;
  "productType": string;
}
export interface LolCatalogSkinLineTier {
  "id": number;
  "name": string;
  "stage": number;
  "description"?: string;
  "splashPath": string;
  "uncenteredSplashPath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "shortName": string;
  "splashVideoPath"?: string;
  "collectionSplashVideoPath"?: string;
  "ownership": LolCatalogSkinLineTierOwnership;
}
export interface LolCatalogSkinLineTierOwnership {
  "owned": boolean;
}
export interface LolChallengesChallengeData {
  "id": number;
  "category": string;
  "legacy": boolean;
  "percentile": number;
  "position": number;
  "playersInLevel": number;
  "initValue": number;
  "previousLevel": string;
  "previousValue": number;
  "previousThreshold": number;
  "newLevels": string[];
  "currentLevel": string;
  "currentValue": number;
  "currentThreshold": number;
  "currentLevelAchievedTime": number;
  "nextLevel": string;
  "nextThreshold": number;
  "friendsAtLevels": LolChallengesFriendLevelsData[];
  "idListType": LolChallengesChallengeRequirementMappingName;
  "availableIds": number[];
  "completedIds": number[];
}
export interface LolChallengesChallengeLevelData {
  "level": string;
}
export interface LolChallengesChallengePlayerData {
  "id": string;
  "puuid": string;
  "source": LolChallengesSource;
  "tags": Record<string, string>;
  "totalPoints": LolChallengesChallengePoints;
  "categoryPoints": Record<string, LolChallengesChallengePoints>;
  "playerChallenges": LolChallengesChallengeData[];
  "levelPoints": Record<string, number>;
  "preferences": LolChallengesChallengesPlayerPreferences;
  "apexLaderUpdateTime": number;
}
export interface LolChallengesChallengePoints {
  "current": number;
  "max": number;
  "level": string;
  "percentile": number;
  "position": number;
}
export type LolChallengesChallengeRequirementMappingName = "CHAMPION" | "CHAMPION_SKIN" | "ITEM" | "NONE";
export interface LolChallengesChallengeSeason {
  "seasonId": number;
  "seasonStart": number;
  "seasonEnd": number;
  "isActive": boolean;
}
export interface LolChallengesChallengeSignedUpdatePayload {
  "tokensByType": Record<string, unknown>;
}
export interface LolChallengesChallengeThreshold {
  "value": number;
  "rewards": LolChallengesChallengeThresholdReward[];
  "rewardGroupId": string;
}
export interface LolChallengesChallengeThresholdReward {
  "category": string;
  "id": string;
  "quantity": number;
}
export interface LolChallengesChallengeTitleData {
  "challengeId": number;
  "challengeName": string;
  "challengeDescription": string;
  "level": string;
  "levelToIconPath": Record<string, string>;
}
export interface LolChallengesChallengesPlayerPreferences {
  "bannerAccent": string;
  "title": string;
  "challengeIds": number[];
  "crestBorder": string;
  "prestigeCrestBorderLevel": number;
  "signedJWTPayload": LolChallengesChallengeSignedUpdatePayload;
}
export interface LolChallengesChallengesRMSNotification {
  "ackRequired": boolean;
  "payload": string;
}
export interface LolChallengesChallengesRMSPayload {
  "puuid": string;
  "id": string;
}
export type LolChallengesClientState = "DarkDisabled" | "DarkHidden" | "Disabled" | "Enabled" | "Hidden";
export interface LolChallengesEndOfGameStats {
  "gameId": number;
}
export interface LolChallengesFriendLevelsData {
  "level": string;
  "friends": string[];
}
export interface LolChallengesFriendResource {
  "puuid": string;
}
export interface LolChallengesGameDataChallengeConfig {
  "name": string;
  "description": string;
  "descriptionShort": string;
  "iconPath": string;
  "tags": Record<string, string>;
  "source": string;
  "queueIds": number[];
  "levelToIconPath": Record<string, string>;
  "thresholds": Record<string, LolChallengesChallengeThreshold>;
  "leaderboard": boolean;
  "reverseDirection": boolean;
  "endTimestamp": number;
  "seasons": number[];
}
export interface LolChallengesGameDataChallengeTitle {
  "name": string;
  "itemId": number;
  "titleAcquisitionType": string;
  "isPermanentTitle": boolean;
  "titleAcquisitionName": string;
  "titleRequirementDescription": string;
  "iconPath": string;
  "backgroundImagePath": string;
}
export interface LolChallengesGameDataChallengesData {
  "challenges": Record<string, LolChallengesGameDataChallengeConfig>;
  "titles": Record<string, LolChallengesGameDataChallengeTitle>;
}
export interface LolChallengesGameflowGameData {
  "queue": LolChallengesQueue;
}
export type LolChallengesGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolChallengesGameflowSession {
  "phase": LolChallengesGameflowPhase;
  "gameData": LolChallengesGameflowGameData;
}
export interface LolChallengesInventoryItem {
  "itemId": number;
  "uuid": string;
  "purchaseDate": string;
}
export interface LolChallengesLcuChallengeNotification {
  "id": number;
  "msgId": string;
  "level": string;
  "updateReason": string;
  "challengeId": number;
  "categoryChallenges": Record<string, LolChallengesUIChallenge>;
  "displayType": LolChallengesNotificationDisplayType;
  "challengeName": string;
  "iconPath": string;
}
export interface LolChallengesLoginPlayerData {
  "clientPlayerDataList": LolChallengesChallengePlayerData[];
  "seasons": LolChallengesChallengeSeason[];
}
export type LolChallengesNotificationDisplayType = "NONE" | "TOAST" | "VIGNETTE";
export interface LolChallengesQueue {
  "id": number;
  "gameMode": string;
}
export interface LolChallengesSequenceEvent {
  "name": string;
  "priority": number;
}
export type LolChallengesSource = "CAP_INVENTORY" | "CHALLENGES" | "CHAMPION_MASTERY" | "CLASH" | "EOGD" | "EOGD_CHAMPION_MASTERY" | "EOGD_RANKED_LEAGUES" | "ETERNALS" | "HONOR" | "LOOT" | "NONE" | "RANKED_LEAGUES" | "SUMMONER_SERVICE";
export interface LolChallengesUICategoryProgress {
  "level": string;
  "category": string;
  "positionPercentile": number;
  "current": number;
  "max": number;
}
export interface LolChallengesUIChallenge {
  "id": number;
  "name": string;
  "description": string;
  "descriptionShort": string;
  "iconPath": string;
  "category": string;
  "nextLevelIconPath": string;
  "currentLevel": string;
  "nextLevel": string;
  "previousLevel": string;
  "previousValue": number;
  "currentValue": number;
  "currentThreshold": number;
  "nextThreshold": number;
  "pointsAwarded": number;
  "percentile": number;
  "currentLevelAchievedTime": number;
  "position": number;
  "playersInLevel": number;
  "isApex": boolean;
  "isCapstone": boolean;
  "gameModes": string[];
  "friendsAtLevels": LolChallengesFriendLevelsData[];
  "parentId": number;
  "parentName": string;
  "childrenIds": number[];
  "capstoneGroupId": number;
  "capstoneGroupName": string;
  "source": string;
  "thresholds": Record<string, LolChallengesUIChallengeThreshold>;
  "levelToIconPath": Record<string, string>;
  "valueMapping": string;
  "hasLeaderboard": boolean;
  "isReverseDirection": boolean;
  "priority": number;
  "idListType": LolChallengesChallengeRequirementMappingName;
  "availableIds": number[];
  "completedIds": number[];
  "retireTimestamp": number;
}
export interface LolChallengesUIChallengePenalty {
  "reason": string;
}
export interface LolChallengesUIChallengeReward {
  "category": string;
  "quantity": number;
  "name": string;
  "asset": string;
}
export interface LolChallengesUIChallengeThreshold {
  "value": number;
  "rewards": LolChallengesUIChallengeReward[];
}
export interface LolChallengesUIPlayerSummary {
  "totalChallengeScore": number;
  "pointsUntilNextRank": number;
  "overallChallengeLevel": string;
  "positionPercentile": number;
  "isApex": boolean;
  "apexLeaderboardPosition": number;
  "title": LolChallengesUITitle;
  "bannerId": string;
  "crestId": string;
  "prestigeCrestBorderLevel": number;
  "categoryProgress": LolChallengesUICategoryProgress[];
  "topChallenges": LolChallengesUIChallenge[];
  "apexLadderUpdateTime": number;
  "selectedChallengesString": string;
}
export interface LolChallengesUITitle {
  "itemId": number;
  "contentId": string;
  "name": string;
  "purchaseDate": string;
  "titleAcquisitionType": string;
  "titleAcquisitionName"?: string;
  "titleRequirementDescription"?: string;
  "isPermanentTitle"?: boolean;
  "challengeTitleData"?: LolChallengesChallengeTitleData;
  "iconPath"?: string;
  "backgroundImagePath"?: string;
}
export interface LolChallengesUserResource {
  "lol": Record<string, string>;
}
export interface LolChampSelectLegacyChampSelectAction {
  "id": number;
  "actorCellId": number;
  "championId": number;
  "type": string;
  "completed": boolean;
  "isAllyAction": boolean;
  "isInProgress": boolean;
  "pickTurn": number;
}
export interface LolChampSelectLegacyChampSelectBannedChampions {
  "myTeamBans": number[];
  "theirTeamBans": number[];
  "numBans": number;
}
export interface LolChampSelectLegacyChampSelectChatRoomDetails {
  "multiUserChatId": string;
  "multiUserChatPassword": string;
  "mucJwtDto": LolChampSelectLegacyMucJwtDto;
}
export interface LolChampSelectLegacyChampSelectMySelection {
  "selectedSkinId"?: number;
  "spell1Id"?: number;
  "spell2Id"?: number;
}
export interface LolChampSelectLegacyChampSelectPlayerSelection {
  "cellId": number;
  "championId": number;
  "selectedSkinId": number;
  "spell1Id": number;
  "spell2Id": number;
  "team": number;
  "assignedPosition": string;
  "championPickIntent": number;
  "playerType": string;
  "summonerId": number;
  "puuid": string;
}
export interface LolChampSelectLegacyChampSelectSession {
  "timer": LolChampSelectLegacyChampSelectTimer;
  "chatDetails": LolChampSelectLegacyChampSelectChatRoomDetails;
  "myTeam": LolChampSelectLegacyChampSelectPlayerSelection[];
  "theirTeam": LolChampSelectLegacyChampSelectPlayerSelection[];
  "trades": LolChampSelectLegacyChampSelectSwapContract[];
  "actions": unknown[];
  "bans": LolChampSelectLegacyChampSelectBannedChampions;
  "localPlayerCellId": number;
  "isSpectating": boolean;
  "allowSkinSelection": boolean;
  "allowBattleBoost": boolean;
  "allowRerolling": boolean;
  "rerollsRemaining": number;
  "hasSimultaneousBans": boolean;
  "hasSimultaneousPicks": boolean;
  "showQuitButton": boolean;
  "isLegacyChampSelect": boolean;
  "isCustomGame": boolean;
}
export interface LolChampSelectLegacyChampSelectSwapContract {
  "id": number;
  "cellId": number;
  "state": LolChampSelectLegacyChampSelectSwapState;
}
export type LolChampSelectLegacyChampSelectSwapState = "AVAILABLE" | "BUSY" | "INVALID" | "RECEIVED" | "SENT";
export interface LolChampSelectLegacyChampSelectTimer {
  "adjustedTimeLeftInPhase": number;
  "totalTimeInPhase": number;
  "phase": string;
  "isInfinite": boolean;
  "internalNowInEpochMs": number;
}
export interface LolChampSelectLegacyChampionSelectPreferences {
  "skins": Record<string, number>;
  "spells": Record<string, unknown>;
}
export interface LolChampSelectLegacyCollectionsChampion {
  "disabledQueues": string[];
  "freeToPlay": boolean;
  "id": number;
  "ownership": LolChampSelectLegacyCollectionsOwnership;
  "active": boolean;
}
export interface LolChampSelectLegacyCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolChampSelectLegacyCollectionsRental;
}
export interface LolChampSelectLegacyCollectionsRental {
  "rented": boolean;
}
export interface LolChampSelectLegacyGameflowGameClient {
  "running": boolean;
  "visible": boolean;
}
export interface LolChampSelectLegacyGameflowGameData {
  "queue": LolChampSelectLegacyQueue;
}
export interface LolChampSelectLegacyGameflowGameDodge {
  "state": LolChampSelectLegacyGameflowGameDodgeState;
  "dodgeIds": number[];
}
export type LolChampSelectLegacyGameflowGameDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
export type LolChampSelectLegacyGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolChampSelectLegacyGameflowSession {
  "phase": LolChampSelectLegacyGameflowPhase;
  "gameClient": LolChampSelectLegacyGameflowGameClient;
  "gameData": LolChampSelectLegacyGameflowGameData;
}
export interface LolChampSelectLegacyInventoryItemWithPayload {
  "itemId": number;
  "payload": unknown;
}
export interface LolChampSelectLegacyLobbyStatus {
  "queueId": number;
  "isCustom": boolean;
  "isLeader": boolean;
  "isSpectator": boolean;
  "allowedPlayAgain": boolean;
  "memberSummonerIds": number[];
}
export interface LolChampSelectLegacyLoginSession {
  "state": LolChampSelectLegacyLoginSessionStates;
  "summonerId": number;
  "connected": boolean;
}
export type LolChampSelectLegacyLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolChampSelectLegacyMucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface LolChampSelectLegacyPlayerStatus {
  "currentLobbyStatus"?: LolChampSelectLegacyLobbyStatus;
  "lastQueuedLobbyStatus"?: LolChampSelectLegacyLobbyStatus;
}
export interface LolChampSelectLegacyQueue {
  "gameTypeConfig": LolChampSelectLegacyQueueGameTypeConfig;
  "areFreeChampionsAllowed": boolean;
}
export interface LolChampSelectLegacyQueueGameTypeConfig {
  "maxAllowableBans": number;
  "allowTrades": boolean;
  "battleBoost": boolean;
  "name": string;
}
export interface LolChampSelectLegacySettingCategoryResource {
  "schemaVersion": number;
  "data": LolChampSelectLegacyChampionSelectPreferences;
}
export interface LolChampSelectLegacySummoner {
  "summonerId": number;
  "summonerLevel": number;
}
export interface LolChampSelectLegacyTeamBoost {
  "summonerId": number;
  "puuid": string;
  "skinUnlockMode": string;
  "price": number;
  "ipReward": number;
  "ipRewardForPurchaser": number;
  "availableSkins": number[];
  "unlocked": boolean;
}
export interface LolChampionMasteryAllChampionMasterySetReward {
  "championMasteries": LolChampionMasteryChampionMastery[];
  "championSet": LolChampionMasteryChampionSet;
  "championSetRewards": Record<string, LolChampionMasterySetRewardEntry>;
  "seasonMilestoneRequireAndRewards": Record<string, LolChampionMasterySeasonMilestoneRequireAndRewards>;
  "newChampionNextLevel": LolChampionMasteryLevelMark;
  "totalScore": number;
}
export interface LolChampionMasteryChampMasteryView {
  "puuid": string;
  "data": LolChampionMasteryChampionMasteryViewData[];
}
export interface LolChampionMasteryChampionMastery {
  "puuid": string;
  "championId": number;
  "championLevel": number;
  "championPoints": number;
  "lastPlayTime": number;
  "championPointsSinceLastLevel": number;
  "championPointsUntilNextLevel": number;
  "markRequiredForNextLevel": number;
  "tokensEarned": number;
  "championSeasonMilestone": number;
  "milestoneGrades": string[];
  "nextSeasonMilestone": LolChampionMasterySeasonMilestoneRequireAndRewards;
  "highestGrade": string;
}
export interface LolChampionMasteryChampionMasteryChangeNotification {
  "gameId": number;
  "puuid": string;
  "championId": number;
  "championLevel": number;
  "championPointsBeforeGame": number;
  "championPointsGained": number;
  "championPointsGainedIndividualContribution": number;
  "bonusChampionPointsGained": number;
  "playerGrade": string;
  "championPointsSinceLastLevelBeforeGame": number;
  "championPointsUntilNextLevelBeforeGame": number;
  "championPointsUntilNextLevelAfterGame": number;
  "championLevelUp": boolean;
  "score": number;
  "levelUpList": LolChampionMasteryChampionMasteryMini[];
  "memberGrades": LolChampionMasteryChampionMasteryGrade[];
  "win": boolean;
  "mapId": number;
  "tokensEarned": number;
  "tokenEarnedAfterGame": boolean;
  "markRequiredForNextLevel": number;
  "championSeasonMilestone": number;
  "championSeasonMilestoneUp": boolean;
  "milestoneGrades": string[];
  "seasonMilestone": LolChampionMasterySeasonMilestoneRequireAndRewards;
}
export interface LolChampionMasteryChampionMasteryGrade {
  "puuid": string;
  "championId": number;
  "grade": string;
}
export interface LolChampionMasteryChampionMasteryMini {
  "puuid": string;
  "championId": number;
  "championLevel": number;
}
export interface LolChampionMasteryChampionMasteryRewardGrantNotification {
  "id": string;
  "gameId": number;
  "puuid": string;
  "championId": number;
  "playerGrade": string;
  "messageKey": string;
}
export interface LolChampionMasteryChampionMasteryViewData {
  "championId": number;
  "championLevel": number;
  "championPoints": number;
  "highestGrade"?: string;
}
export interface LolChampionMasteryChampionSet {
  "champions": number[];
  "totalMilestone": number;
  "completed": boolean;
}
export interface LolChampionMasteryLevelMark {
  "level": number;
  "championPoints": number;
  "marks": number;
}
export interface LolChampionMasteryLoginSession {
  "state": LolChampionMasteryLoginSessionStates;
  "summonerId": number;
  "puuid": string;
  "connected": boolean;
}
export type LolChampionMasteryLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolChampionMasteryRewardConfigurationEntry {
  "rewardValue": string;
  "maximumReward": number;
}
export interface LolChampionMasterySeasonMilestoneRequireAndRewards {
  "requireGradeCounts": Record<string, number>;
  "rewardMarks": number;
  "bonus": boolean;
  "rewardConfig": LolChampionMasteryRewardConfigurationEntry;
}
export interface LolChampionMasterySetRewardEntry {
  "id": string;
  "type": string;
  "value": number;
}
export interface LolChampionMasteryTopChampionMasteries {
  "puuid": string;
  "summonerId": number;
  "score": number;
  "masteries": LolChampionMasteryChampionMastery[];
}
export interface LolChampionMasteryUIAllChampionMasteryWithSets {
  "championMasteries": LolChampionMasteryChampionMastery[];
  "championSet": LolChampionMasteryChampionSet;
  "championSetRewards": Record<string, LolChampionMasterySetRewardEntry>;
  "seasonMilestoneRequireAndRewards": Record<string, LolChampionMasterySeasonMilestoneRequireAndRewards>;
  "defaultChampionMastery": LolChampionMasteryChampionMastery;
  "customRewards": LolChampionMasteryUIChampionMasteryCustomReward[];
  "totalScore": number;
  "championCountByMilestone": Record<string, number>;
}
export interface LolChampionMasteryUIChampionMasteryCustomReward {
  "type": string;
  "level": number;
  "rewardValue": string;
  "quantity": number;
}
export interface LolChampionsChampionQuestSkinInfo {
  "name": string;
  "descriptionInfo": LolChampionsQuestSkinDescriptionInfo[];
  "splashPath": string;
  "uncenteredSplashPath": string;
  "tilePath": string;
  "collectionCardPath": string;
  "collectionDescription": string;
  "tiers": LolChampionsCollectionsChampionQuestSkin[];
  "productType"?: LolChampionsQuestSkinProductType;
}
export interface LolChampionsCollectionsChampion {
  "alias": string;
  "title": string;
  "banVoPath": string;
  "chooseVoPath": string;
  "disabledQueues": string[];
  "id": number;
  "name": string;
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
  "ownership": LolChampionsCollectionsOwnership;
  "purchased": number;
  "roles": string[];
  "squarePortraitPath": string;
  "stingerSfxPath": string;
  "baseLoadScreenPath": string;
  "baseSplashPath": string;
  "active": boolean;
  "botEnabled": boolean;
  "freeToPlay": boolean;
  "rankedPlayEnabled": boolean;
  "isVisibleInClient": boolean;
  "passive": LolChampionsCollectionsChampionSpell;
  "skins": LolChampionsCollectionsChampionSkin[];
  "spells": LolChampionsCollectionsChampionSpell[];
  "tacticalInfo": LolChampionsCollectionsChampionTacticalInfo;
}
export interface LolChampionsCollectionsChampionChroma {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": LolChampionsCollectionsOwnership;
  "disabled": boolean;
  "stillObtainable": boolean;
  "lastSelected": boolean;
  "skinAugments": LolChampionsCollectionsChampionSkinAugments;
  "colors": string[];
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
}
export interface LolChampionsCollectionsChampionMinimal {
  "alias": string;
  "title": string;
  "banVoPath": string;
  "chooseVoPath": string;
  "disabledQueues": string[];
  "id": number;
  "name": string;
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
  "ownership": LolChampionsCollectionsOwnership;
  "purchased": number;
  "roles": string[];
  "squarePortraitPath": string;
  "stingerSfxPath": string;
  "baseLoadScreenPath": string;
  "baseSplashPath": string;
  "active": boolean;
  "botEnabled": boolean;
  "freeToPlay": boolean;
  "rankedPlayEnabled": boolean;
  "isVisibleInClient": boolean;
}
export interface LolChampionsCollectionsChampionPlayableCounts {
  "championsOwned": number;
  "championsRented": number;
  "championsFreeToPlay": number;
  "championsLoyaltyReward": number;
  "championsXboxGPReward": number;
}
export interface LolChampionsCollectionsChampionQuestSkin {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": LolChampionsCollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "lastSelected": boolean;
  "skinAugments": LolChampionsCollectionsChampionSkinAugments;
  "splashPath": string;
  "tilePath": string;
  "stage": number;
  "description": string;
  "uncenteredSplashPath": string;
  "loadScreenPath": string;
  "shortName": string;
  "splashVideoPath": string;
  "collectionSplashVideoPath": string;
}
export interface LolChampionsCollectionsChampionSkin {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": LolChampionsCollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "lastSelected": boolean;
  "skinAugments": LolChampionsCollectionsChampionSkinAugments;
  "splashPath": string;
  "tilePath": string;
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
  "chromas": LolChampionsCollectionsChampionChroma[];
  "questSkinInfo": LolChampionsChampionQuestSkinInfo;
  "emblems": LolChampionsCollectionsChampionSkinEmblem[];
  "uncenteredSplashPath": string;
  "loadScreenPath": string;
  "rarityGemPath": string;
  "splashVideoPath"?: string;
  "collectionSplashVideoPath"?: string;
  "skinType"?: string;
  "featuresText"?: string;
}
export interface LolChampionsCollectionsChampionSkinAugment {
  "contentId": string;
  "overlays": LolChampionsCollectionsChampionSkinAugmentOverlays[];
}
export interface LolChampionsCollectionsChampionSkinAugmentOverlays {
  "centeredLCOverlayPath": string;
  "socialCardLCOverlayPath": string;
  "tileLCOverlayPath": string;
  "uncenteredLCOverlayPath": string;
}
export interface LolChampionsCollectionsChampionSkinAugments {
  "augments": LolChampionsCollectionsChampionSkinAugment[];
}
export interface LolChampionsCollectionsChampionSkinEmblem {
  "name": string;
  "emblemPath": LolChampionsCollectionsChampionSkinEmblemPath;
  "positions": LolChampionsCollectionsChampionSkinEmblemPosition;
}
export interface LolChampionsCollectionsChampionSkinEmblemPath {
  "large": string;
  "small": string;
}
export interface LolChampionsCollectionsChampionSkinEmblemPosition {
  "vertical": string;
  "horizontal": string;
}
export interface LolChampionsCollectionsChampionSkinMinimal {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": LolChampionsCollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "lastSelected": boolean;
  "skinAugments": LolChampionsCollectionsChampionSkinAugments;
  "splashPath": string;
  "tilePath": string;
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
}
export interface LolChampionsCollectionsChampionSpell {
  "name": string;
  "description": string;
}
export interface LolChampionsCollectionsChampionTacticalInfo {
  "style": number;
  "difficulty": number;
  "damageType": string;
}
export interface LolChampionsCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolChampionsCollectionsRental;
}
export interface LolChampionsCollectionsRental {
  "endDate": number;
  "purchaseDate": number;
  "winCountRemaining": number;
  "rented": boolean;
}
export interface LolChampionsGameDataChampion {
  "id": number;
  "alias": string;
  "title": string;
  "banVoPath": string;
  "chooseVoPath": string;
  "name": string;
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
  "squarePortraitPath": string;
  "stingerSfxPath": string;
  "passive": LolChampionsGameDataChampionSpell;
  "roles": string[];
  "skins": LolChampionsGameDataChampionSkin[];
  "spells": LolChampionsGameDataChampionSpell[];
  "tacticalInfo": LolChampionsGameDataChampionTacticalInfo;
  "isVisibleInClient": boolean;
}
export interface LolChampionsGameDataChampionChroma {
  "id": number;
  "name": string;
  "colors": string[];
  "chromaPath": string;
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
  "skinAugments": LolChampionsCollectionsChampionSkinAugments;
}
export interface LolChampionsGameDataChampionQuestSkin {
  "id": number;
  "name": string;
  "stage": number;
  "description": string;
  "splashPath": string;
  "splashVideoPath": string;
  "collectionSplashVideoPath": string;
  "uncenteredSplashPath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "shortName": string;
  "skinAugments": LolChampionsCollectionsChampionSkinAugments;
}
export interface LolChampionsGameDataChampionSkin {
  "id": number;
  "name": string;
  "chromas": LolChampionsGameDataChampionChroma[];
  "questSkinInfo": LolChampionsGameDataQuestSkinInfo;
  "emblems": LolChampionsCollectionsChampionSkinEmblem[];
  "splashPath": string;
  "uncenteredSplashPath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "rarityGemPath": string;
  "relatedPrimeContentId": string;
  "relatedPrimeItemId": number;
  "splashVideoPath"?: string;
  "collectionSplashVideoPath"?: string;
  "chromaPath"?: string;
  "skinType"?: string;
  "featuresText"?: string;
  "skinAugments": LolChampionsCollectionsChampionSkinAugments;
}
export interface LolChampionsGameDataChampionSpell {
  "name": string;
  "description": string;
}
export interface LolChampionsGameDataChampionSummary {
  "id": number;
}
export interface LolChampionsGameDataChampionTacticalInfo {
  "style": number;
  "difficulty": number;
  "damageType": string;
}
export interface LolChampionsGameDataQuestSkinDescriptionInfo {
  "title": string;
  "description": string;
  "iconPath": string;
}
export interface LolChampionsGameDataQuestSkinInfo {
  "name": string;
  "descriptionInfo": LolChampionsGameDataQuestSkinDescriptionInfo[];
  "splashPath": string;
  "uncenteredSplashPath": string;
  "tilePath": string;
  "collectionCardPath": string;
  "collectionDescription": string;
  "tiers": LolChampionsGameDataChampionQuestSkin[];
  "productType"?: LolChampionsQuestSkinProductType;
}
export interface LolChampionsInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "expirationDate": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "owned": boolean;
  "payload": unknown;
}
export interface LolChampionsLcdsDynamicClientConfig {
  "DisabledChampions": unknown;
}
export interface LolChampionsLoginSession {
  "state": LolChampionsLoginSessionStates;
  "summonerId": number;
  "connected": boolean;
}
export type LolChampionsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export type LolChampionsLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolChampionsLoyaltyStatusNotification {
  "status": LolChampionsLoyaltyStatus;
  "reloadInventory": boolean;
}
export interface LolChampionsMatchmakingQueue {
  "id": number;
  "viableChampionRoster": number[];
}
export interface LolChampionsPlayerNotification {
  "backgroundUrl": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolChampionsQuestSkinDescriptionInfo {
  "title": string;
  "description": string;
  "iconPath": string;
}
export type LolChampionsQuestSkinProductType = "kQuestSkin" | "kTieredSkin";
export interface LolChampionsSummoner {
  "summonerId": number;
  "summonerLevel": number;
}
export type LolChatAccountState = "away" | "chat" | "dnd" | "mobile" | "offline";
export interface LolChatActiveConversationResource {
  "id": string;
}
export interface LolChatAuthResourceRsoAccessToken {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export type LolChatAuthType = "rsoCreate" | "rsoRefresh";
export interface LolChatBlocked {
  "pid": string;
  "name": string;
  "game_name": string;
  "game_tag": string;
}
export interface LolChatBlockedList {
  "blocked": LolChatBlocked[];
}
export interface LolChatBlockedPlayerResource {
  "summonerId": number;
  "icon": number;
  "id": string;
  "name": string;
  "pid": string;
  "puuid": string;
  "gameName": string;
  "gameTag": string;
}
export interface LolChatChampSelection {
  "puuid": string;
  "championId": number;
  "selectedSkinIndex": number;
}
export interface LolChatChatDomainConfig {
  "P2PDomainName"?: string;
  "CustomGameDomainName"?: string;
  "ChampSelectDomainName"?: string;
  "PostGameDomainName"?: string;
  "ClubDomainName"?: string;
}
export interface LolChatChatFriendUpdate {
  "pid": string;
  "group": string;
  "note": string;
}
export interface LolChatChatMessage {
  "type": LolChatMessageType;
  "id": string;
  "cid": string;
  "pid": string;
  "mid": string;
  "name": string;
  "game_name": string;
  "game_tag": string;
  "time": string;
  "body": string;
  "read": boolean;
}
export interface LolChatChatMessageList {
  "messages": LolChatChatMessage[];
}
export interface LolChatChatPlatformLoginSession {
  "state": LolChatChatPlatformLoginSessionState;
  "accountId": number;
  "username": string;
  "userAuthToken": string;
  "gasToken": unknown;
  "summonerId"?: number;
  "idToken": string;
  "puuid": string;
  "isNewPlayer": boolean;
}
export type LolChatChatPlatformLoginSessionState = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolChatChatServiceDynamicClientConfig {
  "LcuSocial"?: LolChatLcuSocialConfig;
  "ChatDomain"?: LolChatChatDomainConfig;
}
export type LolChatChatSessionState = "connected" | "connecting" | "disconnected";
export interface LolChatChatSettings {
  "chatGroupDiscord": boolean;
  "chatGroupMobile": boolean;
  "chatGroupOffline": boolean;
  "chatGBG": boolean;
  "recentlyPlayedOpen": boolean;
  "recentlyPlayedFirstOpen": boolean;
  "chatFilterDisabled": boolean;
  "friendRequestToastsDisabled": boolean;
  "linkClickWarningEnabled": boolean;
  "moreUnreadsEnabled": boolean;
  "showWhenTypingEnabled": boolean;
  "bounceDockIconEnabled": boolean;
  "messageNotificationsEnabled": boolean;
  "usePlayerPreferences": boolean;
  "chatWindowDockedHeight": number;
  "sortBy": string;
  "chat-status-message": string;
  "closed-conversations": Record<string, number>;
  "hidden-conversations": Record<string, number>;
  "muted-conversations": Record<string, number>;
  "roster-group-collapsed": Record<string, boolean>;
  "chatWindow": LolChatChatWindowSettings;
}
export interface LolChatChatSummoner {
  "summonerId": number;
  "profileIconId": number;
  "displayName": string;
  "summonerLevel": number;
  "puuid": string;
  "unnamed": boolean;
  "gameName": string;
  "tagLine": string;
}
export interface LolChatChatWindowSettings {
  "detached": boolean;
  "height": number;
  "left": number;
  "top": number;
  "width": number;
}
export interface LolChatCidBody {
  "cid": string;
}
export type LolChatConfigReadinessEnum = "Disabled" | "NotReady" | "Ready";
export interface LolChatConfigStatus {
  "readiness": LolChatConfigReadinessEnum;
}
export type LolChatConfigType = "player" | "public";
export interface LolChatContentCookies {
  "content_id": string;
  "content_path": string;
  "cookies": LolChatcookie[];
}
export interface LolChatConversation {
  "cid": string;
  "type": string;
  "mid": string;
  "unread_count": number;
  "muted": boolean;
}
export interface LolChatConversationJoinFederated {
  "id": string;
  "password": string;
  "type": string;
  "domain": string;
  "targetRegion": string;
  "hidden"?: boolean;
}
export interface LolChatConversationList {
  "conversations": LolChatConversation[];
}
export interface LolChatConversationMessageResource {
  "id": string;
  "type": string;
  "fromSummonerId": number;
  "fromPuuid": string;
  "fromId": string;
  "fromPid": string;
  "fromObfuscatedSummonerId": number;
  "fromObfuscatedPuuid": string;
  "body": string;
  "timestamp": string;
  "isHistorical": boolean;
}
export interface LolChatConversationResource {
  "id": string;
  "name": string;
  "pid": string;
  "gameName": string;
  "gameTag": string;
  "type": string;
  "inviterId": string;
  "password": string;
  "targetRegion": string;
  "isMuted": boolean;
  "unreadMessageCount": number;
  "lastMessage"?: LolChatConversationMessageResource;
  "mucJwtDto": LolChatMucJwtDto;
}
export interface LolChatConversationUpdate {
  "cid": string;
  "muted": boolean;
  "hidden": boolean;
}
export interface LolChatDebugResource {
  "isXMPPLoggingEnabled"?: boolean;
  "keepAliveInterval"?: number;
  "asyncWaitInterval"?: number;
  "minReconnectInterval"?: number;
  "maxReconnectInterval"?: number;
  "triggerChatDisconnect"?: boolean;
  "failNextKeepAlive"?: boolean;
  "failNextChatLogin"?: boolean;
  "failNextChatLogout"?: boolean;
  "failAllChatLogin"?: boolean;
  "enableChatFiltering"?: boolean;
  "silenceChatWhileInGame"?: boolean;
}
export interface LolChatDiscordLink {
  "available": boolean;
  "visible": boolean;
  "linked": boolean;
  "error"?: string;
}
export interface LolChatEndOfGamePlayer {
  "puuid": string;
  "summonerId": number;
  "isLocalPlayer": boolean;
}
export interface LolChatEndOfGameStats {
  "teams": LolChatEndOfGameTeam[];
  "localPlayer": LolChatEndOfGamePlayer;
}
export interface LolChatEndOfGameTeam {
  "players": LolChatEndOfGamePlayer[];
  "isPlayerTeam": boolean;
}
export interface LolChatError {
  "cid": string;
  "class": string;
  "code": string;
  "id": string;
  "pid": string;
  "subtype": string;
  "text": string;
  "ts": string;
  "type": string;
}
export interface LolChatErrorList {
  "errors": LolChatError[];
}
export interface LolChatErrorResource {
  "id": string;
  "from": string;
  "code": number;
  "message": string;
  "text": string;
}
export interface LolChatFriend {
  "pid": string;
  "group": string;
  "displayGroup": string;
  "name": string;
  "game_name": string;
  "game_tag": string;
  "note": string;
  "puuid": string;
  "region": string;
}
export interface LolChatFriendCountsResource {
  "numFriends": number;
  "numFriendsOnline": number;
  "numFriendsAvailable": number;
  "numFriendsAway": number;
  "numFriendsInQueue": number;
  "numFriendsInChampSelect": number;
  "numFriendsInGame": number;
  "numFriendsMobile": number;
}
export interface LolChatFriendGroup {
  "name": string;
  "collapsed": boolean;
  "isMetaGroup": boolean;
}
export interface LolChatFriendGroupCreate {
  "name": string;
  "collapsed": boolean;
}
export interface LolChatFriendGroupList {
  "groups": LolChatFriendGroup[];
}
export interface LolChatFriendGroupOrder {
  "groups": string[];
}
export interface LolChatFriendGroupUpdate {
  "name": string;
  "new_name": string;
  "collapsed": boolean;
}
export interface LolChatFriendList {
  "friends": LolChatFriend[];
}
export interface LolChatFriendRequest {
  "pid": string;
  "name": string;
  "gameName": string;
  "tagLine": string;
  "subscription": LolChatFriendSubscriptionType;
  "note": string;
  "puuid": string;
  "region": string;
}
export interface LolChatFriendRequestAdd {
  "pid": string;
  "name": string;
  "gameName": string;
  "tagLine": string;
  "note": string;
  "puuid": string;
  "region": string;
}
export type LolChatFriendRequestDirection = "both" | "in" | "out";
export interface LolChatFriendRequestList {
  "requests": LolChatFriendRequest[];
}
export interface LolChatFriendRequestResource {
  "summonerId": number;
  "icon": number;
  "id": string;
  "name": string;
  "pid": string;
  "puuid": string;
  "gameName": string;
  "tagLine": string;
  "note": string;
  "direction": LolChatFriendRequestDirection;
}
export interface LolChatFriendResource {
  "summonerId": number;
  "id": string;
  "name": string;
  "pid": string;
  "puuid": string;
  "gameName": string;
  "gameTag": string;
  "icon": number;
  "availability": string;
  "platformId": string;
  "patchline": string;
  "product": string;
  "productName": string;
  "summary": string;
  "time": number;
  "statusMessage": string;
  "note": string;
  "lastSeenOnlineTimestamp"?: string;
  "isP2PConversationMuted": boolean;
  "groupId": number;
  "displayGroupId": number;
  "groupName": string;
  "displayGroupName": string;
  "lol": Record<string, string>;
  "discordInfo"?: LolChatSocialV4DiscordInfo;
  "discordOnlineStatus"?: string;
  "discordId"?: string;
  "relationshipOnRiot": string;
}
export type LolChatFriendSubscriptionType = "pending_in" | "pending_out";
export interface LolChatGameDataChampionSummary {
  "id": number;
  "alias": string;
}
export interface LolChatGameflowGameData {
  "gameId": number;
  "queue": LolChatQueue;
  "teamOne": LolChatTeamPlayerEntry[];
  "teamTwo": LolChatTeamPlayerEntry[];
  "playerChampionSelections": LolChatChampSelection[];
  "spectatorKey": string;
}
export interface LolChatGameflowGameMap {
  "id": number;
}
export type LolChatGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolChatGameflowSession {
  "phase": LolChatGameflowPhase;
  "gameData": LolChatGameflowGameData;
  "map": LolChatGameflowGameMap;
}
export interface LolChatGroupResource {
  "id": number;
  "name": string;
  "isMetaGroup": boolean;
  "isLocalized": boolean;
  "priority": number;
  "collapsed": boolean;
}
export interface LolChatIdBody {
  "id": string;
}
export interface LolChatLcuSocialConfig {
  "ForceChatFilter": boolean;
  "QueueJobGraceSeconds": number;
  "SilenceChatWhileInGame": boolean;
  "AggressiveScanning": boolean;
  "ReplaceRichMessages": boolean;
  "gameNameTaglineEnabled": boolean;
  "allowGroupByGame": boolean;
  "platformToRegionMap": Record<string, string>;
}
export type LolChatLeagueDivision = "I" | "II" | "III" | "IV" | "NA" | "V";
export type LolChatLeagueQueueType = "CHERRY" | "JADE_RANKED_SOLO_5x5" | "NONE" | "RANKED_FLEX_SR" | "RANKED_FLEX_TT" | "RANKED_PREMADE_5x5" | "RANKED_SOLO_5x5" | "RANKED_TFT" | "RANKED_TFT_DOUBLE_UP" | "RANKED_TFT_PAIRS" | "RANKED_TFT_TURBO";
export interface LolChatLobbyMember {
  "id": number;
  "isOwner": boolean;
}
export interface LolChatLobbyPlayerStatus {
  "currentLobbyStatus"?: LolChatLobbyStatus;
  "lastQueuedLobbyStatus"?: LolChatLobbyStatus;
}
export interface LolChatLobbyStatus {
  "queueId": number;
  "isCustom": boolean;
  "isPracticeTool": boolean;
  "isLeader": boolean;
  "isNoSpectateDelay": boolean;
  "memberSummonerIds": number[];
  "customSpectatorPolicy": LolChatQueueCustomGameSpectatorPolicy;
}
export interface LolChatMessage {
  "type": string;
  "id": string;
  "cid": string;
  "pid": string;
  "mid": string;
  "name": string;
  "game_name": string;
  "game_tag": string;
  "time": string;
  "body": string;
  "read": boolean;
}
export interface LolChatMessageList {
  "messages": LolChatMessage[];
}
export interface LolChatMessagePost {
  "cid": string;
  "message": string;
  "type": LolChatMessageType;
}
export interface LolChatMessageSend {
  "message": string;
  "type": string;
}
export type LolChatMessageType = "chat" | "dm" | "groupchat" | "system";
export interface LolChatMucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface LolChatMultiGamePresence {
  "state": LolChatAccountState;
  "msg"?: string;
  "pid": string;
  "puuid": string;
  "region": string;
  "name": string;
  "game_name": string;
  "game_tag": string;
  "resource": string;
  "product": string;
  "summary": string;
  "patchline"?: string;
  "platform"?: string;
  "location"?: string;
  "details"?: string;
  "actor"?: string;
  "time"?: number;
  "privateJwt"?: string;
  "private"?: string;
}
export interface LolChatMultiGamePresenceList {
  "presences": LolChatMultiGamePresence[];
}
export interface LolChatMultiGamePresenceSharedPayload {
  "product"?: string;
  "patchline"?: string;
  "platform"?: string;
  "location"?: string;
  "details"?: string;
  "actor"?: string;
  "time"?: number;
}
export interface LolChatMultiGamePresenceUpdate {
  "state": LolChatAccountState;
  "msg"?: string;
  "privateJwt"?: string;
  "private"?: string;
  "sharedJwt"?: string;
  "shared"?: LolChatMultiGamePresenceSharedPayload;
}
export type LolChatMuteType = "PLAYER_MUTE" | "SETTINGS_MUTE" | "SYSTEM_MUTE";
export interface LolChatMutedPlayerInfo {
  "puuid": string;
  "summonerId": number;
  "obfuscatedPuuid": string;
  "obfuscatedSummonerId": number;
}
export interface LolChatNameBody {
  "name": string;
}
export interface LolChatParticipant {
  "cid": string;
  "pid": string;
  "name": string;
  "game_name": string;
  "game_tag": string;
  "muted": boolean;
  "puuid": string;
  "region": string;
}
export interface LolChatParticipantList {
  "participants": LolChatParticipant[];
}
export interface LolChatPartyPresenceData {
  "isPartyOpen": boolean;
  "agsActivityId": string;
  "partyId": string;
  "queueId": number;
  "summoners": number[];
  "summonerPuuids": string[];
  "maxPlayers": number;
}
export interface LolChatPatchlineMetadata {
  "product_id": string;
  "id": string;
  "content_paths": Record<string, string>;
  "content_cookies": LolChatContentCookies[];
}
export interface LolChatPidBody {
  "pid": string;
}
export interface LolChatPlayerMuteStatus {
  "puuid": string;
  "obfuscatedPuuid": string;
  "isPlayerMuted": boolean;
  "isSettingsMuted": boolean;
  "isSystemMuted": boolean;
}
export interface LolChatPlayerMuteUpdate {
  "puuids": string[];
  "isMuted": boolean;
}
export interface LolChatPlayerPreferences {
  "data": string;
  "type": string;
  "modified": number;
}
export interface LolChatPluginRegionLocaleChangedEvent {
  "region": string;
  "locale": string;
}
export interface LolChatPresenceProduct {
  "product": string;
}
export interface LolChatProductMetadata {
  "id": string;
  "name": string;
  "patchlines": Record<string, LolChatPatchlineMetadata>;
}
export interface LolChatProductMetadataMap {
  "products": Record<string, LolChatProductMetadata>;
}
export interface LolChatPuuidBody {
  "puuid": string;
}
export interface LolChatQueue {
  "id": number;
  "type": string;
  "gameMode": string;
  "isCustom": boolean;
}
export type LolChatQueueCustomGameSpectatorPolicy = "AllAllowed" | "FriendsAllowed" | "LobbyAllowed" | "NotAllowed";
export interface LolChatRankedQueueStats {
  "queueType": LolChatLeagueQueueType;
  "isProvisional": boolean;
  "tier": string;
  "division": LolChatLeagueDivision;
  "wins": number;
  "games": number;
}
export interface LolChatRankedStats {
  "queues": LolChatRankedQueueStats[];
  "highestRankedEntry"?: LolChatRankedQueueStats;
  "rankedRegaliaLevel": number;
  "highestPreviousSeasonEndTier": string;
  "highestPreviousSeasonEndDivision": LolChatLeagueDivision;
}
export interface LolChatRsoAuthorization {
  "currentPlatformId": string;
  "currentAccountId": number;
  "subject": string;
}
export interface LolChatSanitizeRequest {
  "texts": string[];
  "level"?: number;
  "aggressiveScan"?: boolean;
}
export interface LolChatSanitizeResponse {
  "texts"?: string[];
  "modified": boolean;
}
export interface LolChatSanitizerStatus {
  "ready": boolean;
  "platformID": string;
  "locale": string;
}
export interface LolChatSession {
  "state": LolChatChatSessionState;
  "pid": string;
  "name": string;
  "game_name": string;
  "game_tag": string;
  "resource": string;
  "loaded": boolean;
}
export interface LolChatSessionResource {
  "sessionState": LolChatSessionState;
  "sessionExpire": number;
}
export type LolChatSessionState = "connected" | "disconnected" | "initializing" | "loaded" | "shuttingdown";
export interface LolChatSettingsResource {
  "data": unknown;
}
export interface LolChatSocialBlockedList {
  "blockedUsers": LolChatSocialBlockedUser[];
}
export interface LolChatSocialBlockedUser {
  "blockedPlatforms": string[];
  "gameName": string;
  "gameTag": string;
  "isFriendsOnActiveConsole": boolean;
  "puuid": string;
  "relationshipOnConsole": string;
  "relationshipOnDiscord": string;
  "relationshipOnRiot": string;
}
export interface LolChatSocialPresencesSession {
  "player": LolChatSocialPresencesSessionPlayer;
  "activity"?: LolChatSocialPresencesSessionActivity;
  "crossPlayPermissions"?: LolChatSocialPresencesSessionCrossPlayPermissions;
  "party"?: LolChatSocialPresencesSessionParty;
  "productData"?: string;
  "region": string;
}
export interface LolChatSocialPresencesSessionActivity {
  "actors": string[];
  "actorsKeys": string[];
  "location": string;
  "locationKey": string;
  "mode": string;
  "modeKey": string;
  "progress"?: LolChatSocialPresencesSessionActivityProgress;
  "spectate": string;
}
export interface LolChatSocialPresencesSessionActivityProgress {
  "type": string;
  "value": string;
}
export interface LolChatSocialPresencesSessionCrossPlayPermissions {
  "hasPartyCrossPlayEnabled": boolean;
  "hasPlayerCrossPlayEnabled": boolean;
  "isInParty": boolean;
  "partyMemberPlatforms": string[];
}
export interface LolChatSocialPresencesSessionParty {
  "actions": string[];
  "currentSize": number;
  "id": string;
  "maxSize": number;
  "platforms": string[];
}
export interface LolChatSocialPresencesSessionPlayer {
  "profileBanner"?: string;
  "profileIcon"?: string;
  "show": string;
  "state"?: string;
}
export interface LolChatSocialPresencesStatusMessage {
  "statusMessage": string;
}
export interface LolChatSocialV2FriendRequest {
  "gameName": string;
  "note": string;
  "platform": string;
  "puuid": string;
  "subscription": string;
  "tagLine": string;
}
export interface LolChatSocialV2FriendRequestCreate {
  "gameName": string;
  "puuid": string;
  "tagLine": string;
}
export interface LolChatSocialV2FriendRequestList {
  "requests": LolChatSocialV2FriendRequest[];
}
export interface LolChatSocialV4CrossPlayPermissions {
  "hasPartyCrossPlayEnabled": boolean;
  "hasPlayerCrossPlayEnabled": boolean;
  "isInParty": boolean;
  "partyMemberPlatforms": string[];
}
export interface LolChatSocialV4DiscordInfo {
  "displayName": string;
  "onlineStatus": string;
  "isPlayingSameTitle": boolean;
  "relationship": string;
  "discordId": string;
}
export interface LolChatSocialV4DiscordUserData {
  "displayName": string;
  "onlineStatus": string;
}
export interface LolChatSocialV4Friend {
  "activity"?: LolChatSocialPresencesSessionActivity;
  "crossPlayPermissions": LolChatSocialV4CrossPlayPermissions;
  "displayGroup": string;
  "gameName": string;
  "gameTag": string;
  "group": string;
  "namesets": LolChatSocialV4Namesets;
  "note": string;
  "party"?: LolChatSocialPresencesSessionParty;
  "patchline": string;
  "pid": string;
  "platform": string;
  "platformShow": string;
  "product": string;
  "productBannerUrl": string;
  "productData"?: unknown;
  "productFolderName": string;
  "productIconUrl": string;
  "productPresenceName": string;
  "profileBanner": string;
  "profileIcon": string;
  "puuid": string;
  "region": string;
  "discordInfo"?: LolChatSocialV4DiscordInfo;
  "relationshipOnConsole": string;
  "relationshipOnRiot": string;
  "show": string;
  "state": string;
  "statusMessage": string;
}
export interface LolChatSocialV4FriendList {
  "friends": LolChatSocialV4Friend[];
}
export interface LolChatSocialV4Nameset {
  "gameName": string;
  "tagLine": string;
}
export interface LolChatSocialV4Namesets {
  "alias": LolChatSocialV4Nameset;
  "error": string;
  "playstationNameset": LolChatSocialV4PlaystationNameset;
  "providerId": string;
  "puuid": string;
  "switchNameset": LolChatSocialV4SwitchNameset;
  "xboxNameset": LolChatSocialV4XboxNameset;
}
export interface LolChatSocialV4PlaystationNameset {
  "onlineId": string;
}
export interface LolChatSocialV4SwitchNameset {
  "nickname": string;
}
export interface LolChatSocialV4XboxNameset {
  "classicGamertag": string;
  "modernGamertag": string;
  "modernSuffix": string;
}
export interface LolChatSpectateGameInfoResource {
  "dropInSpectateGameId": string;
  "gameQueueType": string;
  "allowObserveMode": string;
  "puuid": string;
}
export interface LolChatSummonerStatus {
  "ready": boolean;
}
export interface LolChatTeamPlayerEntry {
  "puuid": string;
  "summonerId": number;
}
export interface LolChatTranslateRequest {
  "keys": string[];
  "product_id": string;
  "locale": string;
  "patchline": string;
  "blocking": boolean;
}
export interface LolChatTranslateResponse {
  "results": LolChatTranslateResult[];
}
export interface LolChatTranslateResult {
  "found": boolean;
  "key": string;
  "product_id": string;
  "value": string;
}
export interface LolChatUserResource {
  "summonerId": number;
  "id": string;
  "name": string;
  "pid": string;
  "puuid": string;
  "obfuscatedSummonerId": number;
  "gameName": string;
  "gameTag": string;
  "icon": number;
  "availability": string;
  "platformId": string;
  "patchline": string;
  "product": string;
  "productName": string;
  "summary": string;
  "time": number;
  "statusMessage"?: string;
  "lastSeenOnlineTimestamp"?: string;
  "lol": Record<string, string>;
  "discordInfo"?: LolChatSocialV4DiscordInfo;
  "discordUserData"?: LolChatSocialV4DiscordUserData;
  "discordOnlineStatus"?: string;
  "discordId"?: string;
}
export interface LolChatcookie {
  "url": string;
  "name": string;
  "value": string;
  "domain": string;
  "path": string;
  "secure": boolean;
  "httponly": boolean;
  "expires"?: number;
}
export interface LolClashAlias {
  "gameName": string;
  "tagLine": string;
}
export interface LolClashBlockedPlayerResource {
  "summonerId": number;
  "name": string;
  "gameName": string;
  "gameTag": string;
}
export interface LolClashBracket {
  "tournamentId": number;
  "id": number;
  "size": number;
  "matches": BracketMatch[];
  "rosters": BracketRoster[];
  "version": number;
  "period": number;
  "isComplete": boolean;
}
export interface LolClashBracketReadyNotification {
  "tournamentId": number;
  "bracketId": number;
}
export interface LolClashBracketUpdateNotification {
  "tournamentId": number;
  "bracketId": number;
  "currentMatchId": number;
  "winnerRosterId": number;
  "notifyReason": LolClashRosterNotifyReason;
}
export interface LolClashChangeIconRequest {
  "iconId": number;
  "iconColorId": number;
}
export interface LolClashChangeNameRequest {
  "name": string;
}
export interface LolClashClashConfig {
  "Visibility": LolClashClashVisibility;
  "EnabledState": LolClashClashState;
  "DisabledReason": string;
  "EstimatedEnableTimeMillis": number;
  "IconConfig": string;
  "HonorLevelRequired": number;
  "IsPlaymodeRestrictionEnabled": boolean;
  "VoiceRetryDelaySeconds": number;
  "VoiceRetryCountLimit": number;
  "VoiceNoDelayAutoStartSeconds": number;
  "VoiceRandomStartMinSeconds": number;
  "VoiceRandomStartMaxSeconds": number;
  "VoiceEobQuitDelaySeconds": number;
  "RewardGrantRetryIntervalSeconds": number;
  "MaxTimeBeforeLockinNotifySeconds": number;
  "HonorRefreshRetrySeconds": number;
  "EventSendingEnabled": boolean;
  "DisabledEvents": string[];
  "MinClashSummonerLevel": number;
  "MinClashNotificationsSummonerLevel": number;
  "CheckPartiesRegistration": boolean;
}
export interface LolClashClashDisabledConfig {
  "disabledReason": string;
  "estimatedEnableTimeMillis": number;
}
export interface LolClashClashSettingCategory {
  "simpleStateFlagIds"?: string[];
}
export type LolClashClashState = "Disabled" | "Enabled";
export type LolClashClashVisibility = "Hidden" | "Visible";
export interface LolClashClientFailedInvite {
  "playerId": number;
  "exception": string;
}
export interface LolClashClubsSummoner {
  "summonerId": number;
  "displayName": string;
  "profileIconId": number;
  "summonerLevel": number;
}
export interface LolClashEogPlayerUpdateDTO {
  "tournamentId": number;
  "gameId": number;
  "winner": boolean;
  "themeVp": number;
  "seasonVp": number;
  "lowestPosition": number;
  "bracketSize": number;
  "bid": number;
  "tier": number;
  "earnedRewards": ClashRewardDefinition[];
  "rewardProgress": ClashRewardDefinition[];
}
export interface LolClashFindPlayers {
  "invitationId": string;
  "memberId": number;
  "page": number;
  "count": number;
}
export interface LolClashFindTeams {
  "tournamentId": number;
  "page": number;
  "count": number;
}
export type LolClashFoundationError = "CLASH_DISABLED" | "CLASH_NOT_INITIALIZED" | "DESERIALIZATION_FAILED" | "GAMEFLOW_UNAVAILABLE" | "INVALID_SIMPLE_STATE_FLAG" | "LOL_INVENTORY_NOT_READY";
export interface LolClashGameflowAvailability {
  "isAvailable": boolean;
}
export interface LolClashGameflowGameDodge {
  "state": LolClashMatchmakingDodgeState;
  "dodgeIds": number[];
}
export interface LolClashGameflowPartiesRegistrationStatus {
  "complete": boolean;
  "errorCodes": string[];
}
export type LolClashGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolClashGameflowSession {
  "phase": LolClashGameflowPhase;
}
export type LolClashKdaClassification = "AVERAGE" | "HIGH" | "LOW";
export interface LolClashKickRequest {
  "summonerId": number;
}
export interface LolClashLftState {
  "lft": boolean;
  "primaryPos": string;
  "secondaryPos": string;
}
export interface LolClashLoginSession {
  "state": LolClashLoginSessionState;
  "summonerId"?: number;
}
export type LolClashLoginSessionState = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolClashMatchmakingDodgeData {
  "state": LolClashMatchmakingDodgeState;
  "dodgerId": number;
}
export type LolClashMatchmakingDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
export type LolClashMatchmakingDodgeWarning = "ConnectionWarning" | "None" | "Penalty" | "Warning";
export interface LolClashMatchmakingReadyCheckResource {
  "state": LolClashMatchmakingReadyCheckState;
  "playerResponse": LolClashMatchmakingReadyCheckResponse;
  "dodgeWarning": LolClashMatchmakingDodgeWarning;
  "timer": number;
  "declinerIds": number[];
}
export type LolClashMatchmakingReadyCheckResponse = "Accepted" | "Declined" | "None";
export type LolClashMatchmakingReadyCheckState = "Error" | "EveryoneReady" | "InProgress" | "Invalid" | "PartyNotReady" | "StrangerNotReady";
export interface LolClashMatchmakingSearchResource {
  "queueId": number;
  "readyCheck": LolClashMatchmakingReadyCheckResource;
  "dodgeData": LolClashMatchmakingDodgeData;
}
export interface LolClashMemberBanUnbanNotification {
  "playerId": number;
  "notifyPlayerId": number;
  "notifyPuuid": string;
  "reason": string;
  "notifyReason": LolClashNotifyReason;
  "tournaments": MemberBanUnbanTournament[];
}
export interface LolClashMucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface LolClashNoShowPingDTO {
  "tournamentId": number;
  "matchId": number;
  "dodgeTime": number;
}
export interface LolClashNoShowPingResponse {
  "tournamentId": number;
  "matchId": number;
  "dodgeTime": number;
  "data": string;
}
export interface LolClashNoShowPingResponseData {
  "loginTime": number;
  "dodgeTime": number;
  "gameflowState": LolClashGameflowPhase;
  "isPlaymodeRestricted": boolean;
  "readyCheckInfo": LolClashReadyCheckInfo;
}
export type LolClashNotifyReason = "ACCEPT_INVITE" | "ACCEPT_SELFJOIN" | "ACCEPT_SUGGESTION" | "ACCEPT_TICKET" | "BAN" | "CAPTAIN_LEAVE" | "CHANGE_LFT" | "CHANGE_LOGO" | "CHANGE_NAME" | "CHANGE_NAMETAGLOGO" | "CHANGE_POSITION" | "CHANGE_SHORTNAME" | "DECLINE_INVITE" | "DECLINE_SELFJOIN" | "DECLINE_SUGGESTION" | "DECLINE_TICKET" | "DISMISS" | "INVITE" | "KICK" | "LEAVE" | "MEMBER_BAN" | "OFFER_TICKET" | "OWNER_CLOSE" | "OWNER_TRANSFER" | "READY" | "RESENT_INVITE" | "REVERTED_REGISTRATION" | "REVOKED_TICKET" | "REVOKE_INVITE" | "REVOKE_SELFJOIN" | "REVOKE_SUGGESTION" | "REWARD_GRANT_FAILED" | "REWARD_GRANT_RETRY" | "ROSTER_DELETE" | "SELFJOIN" | "SET_TICKET" | "SUGGESTION" | "TEAMMATE_BAN" | "TEAMMATE_UNBAN" | "UNBAN" | "UNREADY";
export interface LolClashOfferTicketRequest {
  "ticketAmount": number;
  "ticketType": TicketType;
}
export interface LolClashPendingRosterNotification {
  "pendingRoster": PendingRosterDTO;
  "notifyReason": LolClashNotifyReason;
  "sourcePlayerId": number;
  "targetPlayerId": number;
}
export interface LolClashPlayerChatRoster {
  "tournamentId": number;
  "startTimeMs": number;
  "endTimeMs": number;
  "tournamentState": LolClashTournamentState;
  "playerState": LolClashPlayerState;
  "isRegistered": boolean;
  "name": string;
  "shortName": string;
  "iconId": number;
  "iconColorId": number;
  "logoUrl": string;
  "invitationId": string;
  "multiUserChatId": string;
  "multiUserChatPassword": string;
  "mucJwtDto": LolClashMucJwtDto;
}
export interface LolClashPlayerData {
  "tickets": Record<string, number>;
  "isClashBanned": boolean;
  "tier": number;
  "lft": boolean;
  "primaryPos": string;
  "secondaryPos": string;
}
export interface LolClashPlayerNotification {
  "source": string;
  "type": string;
  "id": number;
  "backgroundUrl": string;
  "data": Record<string, string>;
  "state": string;
  "iconUrl": string;
  "titleKey": string;
  "detailKey": string;
  "created": string;
  "expires": string;
  "critical": boolean;
  "dismissible": boolean;
}
export interface LolClashPlayerNotificationData {
  "notifyReason": LolClashNotifyReason;
  "rosterNotifyReason": LolClashRosterNotifyReason;
  "tournamentNotifyReason": LolClashTournamentNotifyReason;
  "sourceSummonerId": number;
  "targetSummonerId": number;
  "notification": LolClashPlayerNotification;
  "keySuffix": string;
}
export interface LolClashPlayerRewards {
  "seasonVp": number;
  "themeVp": LolClashThemeVp[];
}
export type LolClashPlayerState = "BRACKET_ROSTER" | "ELIMINATED" | "NO_ROSTER" | "PENDING_ROSTER" | "REGISTERED_ROSTER";
export interface LolClashPlayerTournamentData {
  "state": LolClashPlayerState;
  "rosterId": string;
  "bracketId": number;
}
export interface LolClashPlayerUpdateNotification {
  "player": PlayerDTO;
  "notifyReason": LolClashNotifyReason;
}
export interface LolClashPlaymodeRestrictedInfo {
  "isRestricted": boolean;
  "tournamentId": number;
  "presenceState": LolClashPresenceState;
  "rosterId": string;
  "phaseId": number;
  "readyForVoice": boolean;
}
export type LolClashPresenceState = "LOCKED_IN" | "NONE" | "SCOUTING";
export interface LolClashProfileInfo {
  "honorLevel": number;
}
export interface LolClashQueue {
  "id": number;
  "mapId": number;
  "name": string;
  "shortName": string;
  "description": string;
  "detailedDescription": string;
  "type": string;
  "gameMode": string;
  "category": LolClashQueueGameCategory;
  "gameTypeConfig": LolClashQueueGameTypeConfig;
  "numPlayersPerTeam": number;
  "minimumParticipantListSize": number;
  "maximumParticipantListSize": number;
  "minLevel": number;
  "isRanked": boolean;
  "areFreeChampionsAllowed": boolean;
  "isTeamBuilderManaged": boolean;
  "queueAvailability": LolClashQueueAvailability;
  "queueRewards": LolClashQueueReward;
  "spectatorEnabled": boolean;
  "pickMode": string;
}
export type LolClashQueueAvailability = "Available" | "DoesntMeetRequirements" | "PlatformDisabled";
export type LolClashQueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface LolClashQueueGameTypeConfig {
  "id": number;
  "name": string;
  "maxAllowableBans": number;
  "allowTrades": boolean;
  "exclusivePick": boolean;
  "duplicatePick": boolean;
  "teamChampionPool": boolean;
  "crossTeamChampionPool": boolean;
  "advancedLearningQuests": boolean;
  "battleBoost": boolean;
  "deathMatch": boolean;
  "doNotRemove": boolean;
  "learningQuests": boolean;
  "onboardCoopBeginner": boolean;
  "reroll": boolean;
  "mainPickTimerDuration": number;
  "postPickTimerDuration": number;
  "banTimerDuration": number;
  "pickMode": string;
  "banMode": string;
}
export interface LolClashQueueReward {
  "isIpEnabled": boolean;
  "isXpEnabled": boolean;
  "isChampionPointsEnabled": boolean;
  "partySizeIpRewards": number[];
}
export interface LolClashRankedScoutingMember {
  "playerId": number;
  "championScoutingData": LolClashRankedScoutingTopChampion[];
}
export interface LolClashRankedScoutingTopChampion {
  "championId": number;
  "rank": number;
  "winCount": number;
  "gameCount": number;
  "winRate": number;
  "kda": string;
  "kdaClassification": LolClashKdaClassification;
}
export interface LolClashReadyCheckInfo {
  "timestampReceived": number;
  "timestampResponseComplete": number;
  "timestampLastClashGameflowDodge": number;
  "queueId": number;
  "isAcceptSuccessful": boolean;
  "acceptError": string;
  "readyCheckResource": LolClashMatchmakingReadyCheckResource;
}
export interface LolClashRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolClashRegisteredRosterNotification {
  "roster": RosterDTO;
  "notifyReason": LolClashRosterNotifyReason;
}
export interface LolClashRoster {
  "tournamentId": number;
  "invitationId": string;
  "id": string;
  "name": string;
  "shortName": string;
  "iconId": number;
  "iconColorId": number;
  "captainSummonerId": number;
  "tier": number;
  "points": number;
  "wins": number;
  "losses": number;
  "currentBracketWins": number;
  "numCompletedPeriods": number;
  "isEliminated": boolean;
  "isRegistered": boolean;
  "isActiveInCurrentPhase": boolean;
  "isCurrentBracketComplete": boolean;
  "highTierVariance": boolean;
  "members": LolClashRosterMember[];
  "availableLogos": RewardLogo[];
  "suggestedInvites": LolClashSuggestedInvite[];
  "phaseInfos": LolClashRosterPhaseInfo[];
  "withdraw"?: RosterWithdraw;
  "isClashBanned": boolean;
  "lft": boolean;
}
export interface LolClashRosterDetails {
  "name": string;
  "shortName": string;
  "iconId": number;
  "iconColorId": number;
}
export interface LolClashRosterDynamicStateNotification {
  "rosterDynamicState": RosterDynamicStateDTO;
  "notifyReason": LolClashRosterNotifyReason;
  "sourcePlayerId": number;
}
export interface LolClashRosterMatchAggregatedStats {
  "round": number;
  "durationMs": number;
  "opponentShortName": string;
  "opponentIconId": number;
  "opponentIconColorId": number;
  "win": boolean;
  "loserBracket": boolean;
  "gameId": number;
  "kills": number;
  "opponentKills": number;
  "playerChampionIds": Record<string, number>;
}
export interface LolClashRosterMember {
  "summonerId": number;
  "state": LolClashRosterMemberState;
  "currentBuyin": number;
  "buyinType": TicketType;
  "previousBuyin": number;
  "incomingOffers": LolClashTicketOffer[];
  "position": Position;
  "replacedSummonerId": number;
  "tier": number;
  "inviteType": InviteType;
  "inviterId": number;
}
export type LolClashRosterMemberState = "DECLINED" | "FORCED_NOT_READY" | "NOT_READY" | "PENDING" | "READY";
export type LolClashRosterNotifyReason = "BANNED_SMURF" | "BANNED_SMURF_OPPONENT" | "BANNED_SMURF_TEAMMATE" | "BRACKET_READY" | "BRACKET_ROSTER_REMOVED" | "BRACKET_ROSTER_REPLACED" | "BYE_AUTO_WIN" | "CANNOT_FIND_MATCH" | "CHANGE_POSITION" | "CHEATER_DETECT" | "EOG_PLAYER_UPDATE" | "GAME_COMPLETED" | "GAME_END_ERROR" | "GAME_RESCHEDULED" | "GAME_SCHEDULED" | "GAME_STARTED" | "GAME_STARTED_ERROR" | "GAME_START_FAILED" | "GAME_START_FAILED_OPPONENT" | "GAME_START_FAILED_SUMMONERS" | "GAME_START_RETRY" | "GAME_START_RETRY_OPPONENT" | "GAME_START_RETRY_SUMMONERS" | "NO_SHOW_PING" | "OWNER_TRANSFER" | "PERIOD_CANCEL" | "PERIOD_SPLIT" | "PHASE_BACKOUT" | "PHASE_CHECKIN" | "PHASE_READY" | "PHASE_UNREADY" | "QUEUE_DODGE" | "REGISTERED" | "RESTRICTION_AUTO_WIN" | "ROSTER_ACCEPT_TICKET" | "ROSTER_DECLINE_TICKET" | "ROSTER_OFFER_TICKET" | "ROSTER_REVOKED_TICKET" | "ROSTER_SET_TICKET" | "ROUND_COMPLETE" | "TICKET_CHARGED" | "TICKET_COULD_NOT_BE_CHARGED" | "TICKET_REFUNDED" | "TIER_CHANGED" | "VOTE_WITHDRAW_DISMISS" | "VOTE_WITHDRAW_UPDATE" | "WITHDRAW";
export interface LolClashRosterPeriodAggregatedStats {
  "period": number;
  "bracketSize": number;
  "time": number;
  "matchStats": LolClashRosterMatchAggregatedStats[];
  "playerBids": Record<string, number>;
}
export interface LolClashRosterPhaseInfo {
  "phaseId": number;
  "period": number;
  "checkinTime": number;
  "isBracketComplete": boolean;
}
export interface LolClashRosterPlayerAggregatedStats {
  "rawStatsSum": Record<string, number>;
  "rawStatsMax": Record<string, number>;
}
export interface LolClashRosterPlayerNotification {
  "roster": RosterDTO;
  "notifyReason": LolClashRosterNotifyReason;
  "playerNotificationDTO": PlayerDTO;
  "sourcePlayerId": number;
}
export interface LolClashRosterStats {
  "rosterId": number;
  "tournamentThemeId": number;
  "tournamentNameLocKey": string;
  "tournamentNameLocKeySecondary": string;
  "startTimeMs": number;
  "endTimeMs": number;
  "tournamentPeriods": number;
  "tier": number;
  "rosterName": string;
  "rosterShortName": string;
  "rosterIconId": number;
  "rosterIconColorId": number;
  "periodStats": LolClashRosterPeriodAggregatedStats[];
  "playerStats": Record<string, LolClashRosterPlayerAggregatedStats>;
}
export interface LolClashRosterWithdrawNotification {
  "version": number;
  "tournamentId": number;
  "rosterId": number;
  "withdraw": RosterWithdraw;
  "notifyReason": LolClashRosterNotifyReason;
  "sourcePlayerId": number;
}
export interface LolClashScoutingChampionMastery {
  "championId": number;
  "championLevel": number;
  "championPoints": number;
}
export interface LolClashScoutingChampions {
  "playerId": number;
  "totalMasteryScore": number;
  "topMasteries": LolClashScoutingChampionMastery[];
  "topSeasonChampions": LolClashScoutingSeasonChampion[];
}
export interface LolClashScoutingSeasonChampion {
  "championId": number;
  "winCount": number;
  "gameCount": number;
  "winRate": number;
  "kda": string;
  "kdaClassification": LolClashKdaClassification;
}
export interface LolClashSetPositionRequest {
  "position": Position;
}
export interface LolClashSetTicketRequest {
  "ticketAmount": number;
  "ticketType": TicketType;
}
export interface LolClashSettingCategory {
  "schemaVersion": number;
  "data": unknown;
}
export interface LolClashSimpleStateFlag {
  "id": string;
  "status": LolClashSimpleStateStatus;
}
export type LolClashSimpleStateStatus = "ACKNOWLEDGED" | "UNACKNOWLEDGED";
export interface LolClashSuggestedInvite {
  "summonerId": number;
  "suggesterSummonerId": number;
}
export interface LolClashSuggestionInvite {
  "inviterId": number;
  "inviteePlayers": number[];
}
export interface LolClashSuggestionInvitee {
  "captainId": number;
  "inviteeId": number;
}
export interface LolClashTeamOpenState {
  "invitationId": string;
  "captainId": number;
  "openTeam": boolean;
}
export interface LolClashThemeVp {
  "themeId": number;
  "vp": number;
}
export interface LolClashThirdPartyApiPlayer {
  "summonerId": number;
  "role": string;
}
export interface LolClashThirdPartyApiRoster {
  "captain": LolClashThirdPartyApiPlayer;
  "members": LolClashThirdPartyApiPlayer[];
}
export interface LolClashTicketOffer {
  "summonerId": number;
  "amount": number;
  "ticketType": TicketType;
  "isAccepted": boolean;
}
export interface LolClashTournament {
  "id": number;
  "themeId": number;
  "nameLocKey": string;
  "nameLocKeySecondary": string;
  "buyInOptions": number[];
  "buyInOptionsPremium": number[];
  "entryFee": number;
  "rosterSize": number;
  "allowRosterCreation": boolean;
  "rosterCreateDeadline": number;
  "scoutingDurationMs": number;
  "startTimeMs": number;
  "endTimeMs": number;
  "lastThemeOfSeason": boolean;
  "bracketSize": string;
  "queueId": number;
  "isSmsRestrictionEnabled": boolean;
  "isHonorRestrictionEnabled": boolean;
  "isRankedRestrictionEnabled": boolean;
  "phases": LolClashTournamentPhase[];
  "rewardConfig": ClashRewardConfigClient[];
  "tierConfigs": TierConfig[];
  "bracketFormationInitDelayMs": number;
  "bracketFormationIntervalMs": number;
  "status": TournamentStatusEnum;
  "resumeTime": number;
  "lft": boolean;
  "maxInvites": number;
  "maxSuggestionsPerPlayer": number;
}
export interface LolClashTournamentGameEnd {
  "tournamentId": number;
  "tournamentNameLocKey": string;
  "tournamentNameLocKeySecondary": string;
  "bracketId": number;
  "oldBracket"?: LolClashBracket;
}
export interface LolClashTournamentHistoryAndWinners {
  "tournamentHistory": LolClashTournament[];
  "tournamentWinners": LolClashTournamentWinnerHistory;
}
export type LolClashTournamentNotifyReason = "ADD_PHASE" | "CANCEL_PERIOD" | "CANCEL_TOURNAMENT" | "NEW_TOURNAMENT" | "REVERT_PHASE" | "UPDATE_PHASE" | "UPDATE_STATUS" | "UPDATE_TOURNAMENT";
export interface LolClashTournamentPhase {
  "id": number;
  "tournamentId": number;
  "period": number;
  "lockinStartTime": number;
  "scoutingStartTime": number;
  "cancelled": boolean;
  "limitTiers": number[];
  "capacityStatus": CapacityEnum;
}
export interface LolClashTournamentPhaseProgressNotificationDTO {
  "tournamentId": number;
  "phaseId": number;
  "capacityStatus": CapacityEnum;
}
export type LolClashTournamentState = "IDLE" | "IN_GAME" | "LOCK_IN" | "RESULTS" | "SCOUTING" | "UPCOMING";
export interface LolClashTournamentStateInfo {
  "tournamentId": number;
  "state": LolClashTournamentState;
  "currentPhaseId": number;
  "nextPhaseId": number;
  "nextStateChangeTime": number;
  "numRemainingPeriods": number;
}
export interface LolClashTournamentSummary {
  "state": LolClashTournamentState;
  "tournamentId": number;
  "rosterId": string;
  "bracketId": number;
}
export interface LolClashTournamentUpdatedNotification {
  "missingPlayerIds": number[];
  "currentRetry": number;
  "maxRetry": number;
  "retrySeconds": number;
  "notifyReason": LolClashRosterNotifyReason;
}
export interface LolClashTournamentUpdatedNotificationDTO {
  "reason": LolClashTournamentNotifyReason;
  "tournamentId": number;
  "tournament"?: TournamentDTO;
  "relevantPhaseId"?: number;
}
export interface LolClashTournamentWinnerHistory {
  "tournamentId": number;
  "winners": LolClashTournamentWinnerInfo[];
}
export interface LolClashTournamentWinnerInfo {
  "rosterId": number;
  "tier": number;
  "shortName": string;
  "name": string;
  "logo": number;
  "logoColor": number;
  "createTime": number;
  "averageWinDuration": number;
  "playerIds": number[];
}
export interface LolClashUserResource {
  "summonerId": number;
  "lol": Record<string, string>;
}
export interface LolCollectionsAccountIdAndSummonerId {
  "summonerId": number;
}
export interface LolCollectionsChampionMastery {
  "puuid": string;
  "championId": number;
  "championLevel": number;
  "championPoints": number;
  "lastPlayTime": number;
  "championPointsSinceLastLevel": number;
  "championPointsUntilNextLevel": number;
  "markRequiredForNextLevel": number;
  "tokensEarned": number;
  "championSeasonMilestone": number;
  "milestoneGrades": string[];
  "nextSeasonMilestone": LolCollectionsSeasonMilestoneRequireAndRewards;
  "highestGrade": string;
}
export interface LolCollectionsCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolCollectionsCollectionsRental;
}
export interface LolCollectionsCollectionsRental {
  "endDate": number;
  "purchaseDate": number;
  "winCountRemaining": number;
  "rented": boolean;
}
export interface LolCollectionsCollectionsSummonerBackdrop {
  "summonerId": number;
  "accountId": number;
  "profileIconId": number;
  "championId": number;
  "backdropType": LolCollectionsCollectionsSummonerBackdropType;
  "backdropImage": string;
  "backdropAugments": LolCollectionsCollectionsSummonerBackdropAugments[];
  "backdropVideo": string;
  "backdropMaskColor": string;
  "puuid": string;
}
export interface LolCollectionsCollectionsSummonerBackdropAugments {
  "centeredLCOverlayPath": string;
  "socialCardLCOverlayPath": string;
}
export type LolCollectionsCollectionsSummonerBackdropType = "default" | "highest-mastery" | "specified-skin" | "summoner-icon";
export interface LolCollectionsCollectionsSummonerSpells {
  "summonerId": number;
  "spells": number[];
}
export interface LolCollectionsCollectionsWardSkin {
  "id": number;
  "name": string;
  "description": string;
  "ownership": LolCollectionsCollectionsOwnership;
  "wardImagePath": string;
  "wardShadowImagePath": string;
}
export interface LolCollectionsCollectionsWardSkinList {
  "wardSkinList": number[];
}
export interface LolCollectionsGameDataChampionMasteries {
  "tree": LolCollectionsGameDataChampionMasteryTree;
}
export interface LolCollectionsGameDataChampionMasteryGroup {
  "id": number;
  "rows": LolCollectionsGameDataChampionMasteryRow[];
}
export interface LolCollectionsGameDataChampionMasteryRow {
  "masteries": number[];
}
export interface LolCollectionsGameDataChampionMasteryTree {
  "groups": LolCollectionsGameDataChampionMasteryGroup[];
}
export interface LolCollectionsGameDataChampionQuestSkin {
  "id": number;
  "name": string;
  "splashPath": string;
  "splashVideoPath": string;
  "skinAugments": LolCollectionsGameDataChampionSkinAugments;
}
export interface LolCollectionsGameDataChampionSkin {
  "id": number;
  "isBase": boolean;
  "name": string;
  "questSkinInfo": LolCollectionsGameDataQuestSkinInfo;
  "splashPath": string;
  "splashVideoPath"?: string;
  "skinAugments": LolCollectionsGameDataChampionSkinAugments;
}
export interface LolCollectionsGameDataChampionSkinAugment {
  "contentId": string;
  "overlays": LolCollectionsGameDataChampionSkinAugmentOverlays[];
}
export interface LolCollectionsGameDataChampionSkinAugmentOverlays {
  "centeredLCOverlayPath": string;
  "socialCardLCOverlayPath": string;
  "tileLCOverlayPath": string;
  "uncenteredLCOverlayPath": string;
}
export interface LolCollectionsGameDataChampionSkinAugments {
  "augments": LolCollectionsGameDataChampionSkinAugment[];
}
export interface LolCollectionsGameDataChampionSummary {
  "id": number;
}
export interface LolCollectionsGameDataQuestSkinInfo {
  "tiers": LolCollectionsGameDataChampionQuestSkin[];
}
export interface LolCollectionsGameDataSplashMetadata {
  "CalculatedColor": string;
  "OverrideColor": string;
}
export interface LolCollectionsInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolCollectionsItemOwnershipType;
}
export interface LolCollectionsInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "ownedQuantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "payload": unknown;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "lsb": boolean;
  "wins": number;
}
export interface LolCollectionsInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolCollectionsItemOwnershipType;
  "payload": unknown;
}
export type LolCollectionsItemOwnershipType = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolCollectionsLcdsDynamicClientConfig {
  "DisabledChampions": unknown;
}
export interface LolCollectionsLoginSession {
  "state": LolCollectionsLoginSessionStates;
  "summonerId": number;
  "puuid": string;
  "connected": boolean;
}
export type LolCollectionsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolCollectionsNumberFormattingBehavior {
  "digitsForThousandsSeperator": number;
  "trimTrailingZerosAfterDecimal": boolean;
  "westernNumberGrouping": boolean;
}
export interface LolCollectionsNumberFormattingData {
  "decimalSeperator": string;
  "thousandSeperator": string;
  "thousandAbbreviation": string;
  "tenThousandAbbreviation": string;
  "millionAbbreviation": string;
  "oneHundredMillionAbbreviation": string;
  "billionAbbreviation": string;
  "trillionAbbreviation": string;
  "secondAbbreviation": string;
  "minuteAbbreviation": string;
  "hourAbbreviation": string;
  "metersAbbreviation": string;
  "kilometersAbbreviation": string;
  "percentageFormat": string;
  "numberFormattingBehavior": LolCollectionsNumberFormattingBehavior;
}
export interface LolCollectionsPlayerNotification {
  "backgroundUrl": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolCollectionsRewardConfigurationEntry {
  "rewardValue": string;
  "maximumReward": number;
}
export interface LolCollectionsSeasonMilestoneRequireAndRewards {
  "requireGradeCounts": Record<string, number>;
  "rewardMarks": number;
  "bonus": boolean;
  "rewardConfig": LolCollectionsRewardConfigurationEntry;
}
export interface LolCollectionsSummoner {
  "summonerId": number;
  "accountId": number;
  "summonerLevel": number;
  "profileIconId": number;
  "puuid": string;
}
export interface LolCollectionsSummonerProfile {
  "backgroundSkinId"?: number;
  "backgroundSkinAugments"?: string;
}
export interface LolCollectionsSummonerProfileUpdate {
  "key": string;
  "value": unknown;
}
export interface LolCollectionsTopChampionMasteries {
  "puuid": string;
  "summonerId": number;
  "score": number;
  "masteries": LolCollectionsChampionMastery[];
}
export interface LolCosmeticsAccountSettingsCategoryDataResource {
  "typeToLastOpenedDate": Record<string, number>;
}
export interface LolCosmeticsCapOffer {
  "id": string;
  "typeId": string;
  "label": string;
  "productId": string;
  "merchantId": string;
  "payload": unknown[];
  "active": boolean;
  "startDate": string;
  "createdDate": string;
}
export interface LolCosmeticsCatalogEntryDto {
  "id": string;
  "productId": string;
  "name": string;
  "description": string;
  "endTime": string;
  "purchaseUnits": LolCosmeticsPurchaseUnitDto[];
  "displayMetadata": unknown;
  "refundRule": string;
  "giftRule": string;
  "prerequisites": LolCosmeticsPrerequisiteDto[];
  "purchaseLimits": LolCosmeticsVelocityLimitDeltaDto[];
}
export interface LolCosmeticsChemtechShoppeDropsFulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "ownershipCompensationMode": string;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
}
export interface LolCosmeticsChemtechShoppeDropsRollDto {
  "fulfillments": LolCosmeticsChemtechShoppeDropsFulfillmentDto[];
}
export interface LolCosmeticsChemtechShoppeDropsRollResultsDto {
  "rolls": LolCosmeticsChemtechShoppeDropsRollDto[];
}
export interface LolCosmeticsCompanionsFavoritesViewModel {
  "favoriteItems": LolCosmeticsCosmeticsCompanionViewModel[];
}
export interface LolCosmeticsCompanionsGroupViewModel {
  "groupName": string;
  "groupId": number;
  "numOwned": number;
  "numAvailable": number;
  "purchaseDate": number;
  "items": LolCosmeticsCosmeticsCompanionViewModel[];
}
export interface LolCosmeticsCompanionsGroupedViewModel {
  "selectedLoadoutItem": LolCosmeticsCosmeticsCompanionViewModel;
  "defaultItemId": number;
  "groups": LolCosmeticsCompanionsGroupViewModel[];
  "resetLoadoutItem": LolCosmeticsCosmeticsCompanionViewModel;
  "didResetSelection": boolean;
}
export interface LolCosmeticsCosmeticSettingsResource {
  "data"?: LolCosmeticsAccountSettingsCategoryDataResource;
  "schemaVersion": number;
}
export interface LolCosmeticsCosmeticsCompanion {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "species": string;
  "groupId": number;
  "color": string;
  "level": number;
  "upgrades": string[];
  "companionType": string;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsCosmeticsCompanionViewModel {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "favorited": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "isRecentItem": boolean;
  "loyaltySources": string[];
  "species": string;
  "groupId": number;
  "color": string;
  "level": number;
  "upgrades": LolCosmeticsCosmeticsCompanionViewModel[];
  "offerData"?: LolCosmeticsCapOffer;
  "starShardsPrice": LolCosmeticsCosmeticsOfferPrice;
  "companionType": string;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsCosmeticsOfferPrice {
  "offerId": string;
  "price": number;
  "chemtechUpgradeStoreId": string;
}
export interface LolCosmeticsCosmeticsSettings {
  "favorites": LolCosmeticsFavoriteCosmetics;
}
export interface LolCosmeticsCosmeticsTFTAugmentPillar {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "groupId": number;
  "groupName": string;
  "TFTRarity": string;
}
export interface LolCosmeticsCosmeticsTFTAugmentPillarViewModel {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "favorited": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "isRecentItem": boolean;
  "groupId": number;
  "groupName": string;
  "TFTRarity": string;
}
export interface LolCosmeticsCosmeticsTFTDamageSkin {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "level": number;
  "groupId": number;
  "groupName": string;
  "upgrades": string[];
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsCosmeticsTFTDamageSkinViewModel {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "favorited": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "isRecentItem": boolean;
  "loyaltySources": string[];
  "level": number;
  "groupId": number;
  "groupName": string;
  "upgrades": LolCosmeticsCosmeticsTFTDamageSkinViewModel[];
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsCosmeticsTFTMapSkin {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "groupId": number;
  "groupName": string;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsCosmeticsTFTMapSkinViewModel {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "favorited": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "isRecentItem": boolean;
  "loyaltySources": string[];
  "groupId": number;
  "groupName": string;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsCosmeticsTFTPlaybook {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "iconPath": string;
  "iconPathSmall": string;
  "splashPath": string;
  "earlyAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "midAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "lateAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "isDisabledInDoubleUp": boolean;
}
export interface LolCosmeticsCosmeticsTFTPlaybookAugment {
  "name": string;
  "description": string;
  "iconPath": string;
  "effectAmounts": LolCosmeticsCosmeticsTFTPlaybookAugmentEffectAmount[];
}
export interface LolCosmeticsCosmeticsTFTPlaybookAugmentEffectAmount {
  "name": string;
  "value": number;
  "formatString": string;
}
export interface LolCosmeticsCosmeticsTFTPlaybookViewModel {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "isRecentItem": boolean;
  "iconPath": string;
  "iconPathSmall": string;
  "splashPath": string;
  "earlyAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "midAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "lateAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "isDisabledInDoubleUp": boolean;
}
export interface LolCosmeticsCosmeticsTFTZoomSkin {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "groupId": number;
  "groupName": string;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsCosmeticsTFTZoomSkinViewModel {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "favorited": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "isRecentItem": boolean;
  "loyaltySources": string[];
  "groupId": number;
  "groupName": string;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsEntitlementDto {
  "id": string;
  "label": string;
  "typeId": string;
  "productId": string;
  "active": boolean;
  "createdDate": string;
  "lastModifiedDate": string;
  "firstUsedDate": string;
  "recipient": unknown;
  "ownerId": string;
  "item": LolCosmeticsEntitlementItemDto;
}
export interface LolCosmeticsEntitlementItemDto {
  "id": string;
  "typeId": string;
}
export interface LolCosmeticsEntitlementsResponse {
  "data": LolCosmeticsEntitlementDto[];
}
export interface LolCosmeticsFavoriteCosmetics {
  "companions": string[];
  "tft_map_skins": string[];
  "tft_damage_skins": string[];
}
export interface LolCosmeticsFinalPurchaseUnitDto {
  "payments": LolCosmeticsPaymentDto[];
  "fulfillment": LolCosmeticsFulfillmentDto;
}
export interface LolCosmeticsFulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "ownershipCompensationMode": string;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
  "progressionCounterId": string;
  "dropTableId": string;
  "results": LolCosmeticsChemtechShoppeDropsRollResultsDto;
}
export interface LolCosmeticsGameDataCompanion {
  "contentId": string;
  "itemId": number;
  "name": string;
  "loadoutsIcon": string;
  "description": string;
  "speciesName": string;
  "speciesId": number;
  "colorName": string;
  "level": number;
  "rarityValue": number;
  "upgrades": string[];
  "TFTOnly": boolean;
  "companionType": string;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsGameDataTFTAugmentPillar {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "TFTRarity": string;
}
export interface LolCosmeticsGameDataTFTCosmeticsDefaults {
  "playbook": unknown;
}
export interface LolCosmeticsGameDataTFTDamageSkin {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "groupId": number;
  "groupName": string;
  "rarityValue": number;
  "level": number;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsGameDataTFTMapSkin {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "groupId": number;
  "groupName": string;
  "rarityValue": number;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsGameDataTFTPlaybook {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "translatedName": string;
  "translatedDescription": string;
  "loadoutsIcon": string;
  "iconPath": string;
  "iconPathSmall": string;
  "splashPath": string;
  "enabled": boolean;
  "earlyAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "midAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "lateAugments": LolCosmeticsCosmeticsTFTPlaybookAugment[];
  "isDisabledInDoubleUp": boolean;
}
export interface LolCosmeticsGameDataTFTZoomSkin {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "groupId": number;
  "groupName": string;
  "rarityValue": number;
  "TFTRarity": string;
  "IsWIP": boolean;
}
export interface LolCosmeticsLoadout {
  "id": string;
  "name": string;
  "scope": string;
  "itemId": number;
  "loadout": Record<string, LolCosmeticsLoadoutItem>;
}
export interface LolCosmeticsLoadoutItem {
  "inventoryType": string;
  "contentId": string;
  "itemId": number;
}
export interface LolCosmeticsLoadoutUpdateDto {
  "loadout": Record<string, LolCosmeticsLoadoutItem>;
}
export interface LolCosmeticsPagination {
  "offset": number;
  "limit": number;
  "maxLimit": number;
  "total": number;
  "previous": string;
  "next": string;
}
export interface LolCosmeticsPaymentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "discountedDelta": number;
  "discountPercent": number;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
}
export interface LolCosmeticsPaymentOptionDto {
  "key": string;
  "payments": LolCosmeticsPaymentDto[];
}
export interface LolCosmeticsPrerequisiteDto {
  "status": string;
  "itemTypeId": string;
  "itemId": string;
  "requiredQuantity": number;
}
export interface LolCosmeticsPurchaseDto {
  "id": string;
  "productId": string;
  "storeId": string;
  "storeName": string;
  "catalogEntryId": string;
  "catalogEntryName": string;
  "purchaserId": string;
  "recipientId": string;
  "purchaseUnits": LolCosmeticsFinalPurchaseUnitDto[];
  "createdTime": string;
  "completedTime": string;
  "purchaseState": string;
  "purchaseVisibility": string;
  "refund": LolCosmeticsRefundDto;
  "refundRule": string;
  "refundable": boolean;
  "quantity": number;
  "source": string;
}
export interface LolCosmeticsPurchaseErrorMessageDto {
  "httpStatus": number;
  "errorCode": string;
  "message": string;
}
export interface LolCosmeticsPurchaseHistoryResponse {
  "data": LolCosmeticsPurchaseDto[];
  "paging": LolCosmeticsPagination;
  "stats": LolCosmeticsResponseStats;
  "notes": string[];
  "errors": LolCosmeticsResponseError[];
}
export interface LolCosmeticsPurchaseRequest {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "quantity": number;
}
export interface LolCosmeticsPurchaseRequestDto {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "idempotencyId": string;
  "source": string;
  "quantity": number;
}
export interface LolCosmeticsPurchaseResponse {
  "data": LolCosmeticsPurchaseDto;
  "paging": LolCosmeticsPagination;
  "stats": LolCosmeticsResponseStats;
  "notes": string[];
  "errors": LolCosmeticsResponseError[];
}
export interface LolCosmeticsPurchaseTransaction {
  "purchaseId": string;
  "productId": string;
  "storeId": string;
  "catalogEntryId": string;
  "purchaseState": string;
  "refundId": string;
  "refundState": string;
}
export interface LolCosmeticsPurchaseUnitDto {
  "paymentOptions": LolCosmeticsPaymentOptionDto[];
  "payment": LolCosmeticsPaymentDto[];
  "fulfillment": LolCosmeticsFulfillmentDto;
}
export interface LolCosmeticsRefundDto {
  "id": string;
  "purchaseId": string;
  "createdTime": string;
  "completedTime": string;
  "state": string;
  "source": string;
}
export interface LolCosmeticsRefundRequest {
  "purchaseId": string;
}
export interface LolCosmeticsRefundRequestDto {
  "purchaseId": string;
  "source": string;
}
export interface LolCosmeticsRefundResponse {
  "data": LolCosmeticsRefundDto;
  "paging": LolCosmeticsPagination;
  "stats": LolCosmeticsResponseStats;
  "notes": string[];
  "errors": LolCosmeticsResponseError[];
}
export interface LolCosmeticsRegionLocale {
  "region": string;
  "locale": string;
  "webRegion": string;
}
export interface LolCosmeticsResponseError {
  "message": string;
  "type": string;
  "code": number;
}
export interface LolCosmeticsResponseStats {
  "durationMs": number;
}
export interface LolCosmeticsRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolCosmeticsRotationalShopBundleData {
  "asset": string;
  "description": string;
  "descriptionKey": string;
  "title": string;
  "titleKey": string;
}
export interface LolCosmeticsRotationalShopBundleListData {
  "items": LolCosmeticsRotationalShopBundleData[];
}
export interface LolCosmeticsRotationalShopItemData {
  "backgroundTextureLCU": string;
  "contentID": string;
  "descriptionTraKey": string;
  "description": string;
  "name": string;
  "standaloneLoadoutsLargeIcon": string;
  "videoID": string;
  "redeemIconTexture": string;
  "rarity": string;
  "typeID": string;
  "speciesLink": string;
}
export interface LolCosmeticsSettingsStorageContainer {
  "data": LolCosmeticsCosmeticsSettings;
  "schemaVersion": number;
}
export interface LolCosmeticsStoreDto {
  "id": string;
  "productId": string;
  "name": string;
  "catalogEntries": LolCosmeticsCatalogEntryDto[];
  "displayMetadata": unknown;
  "startTime": string;
  "endTime": string;
}
export interface LolCosmeticsStoresResponse {
  "data": LolCosmeticsStoreDto[];
  "paging": LolCosmeticsPagination;
  "stats": LolCosmeticsResponseStats;
  "notes": string[];
  "errors": LolCosmeticsResponseError[];
}
export interface LolCosmeticsTFTAugmentPillarFavoritesViewModel {
  "favoriteItems": LolCosmeticsCosmeticsTFTAugmentPillarViewModel[];
}
export interface LolCosmeticsTFTAugmentPillarGroupViewModel {
  "groupName": string;
  "groupId": number;
  "numOwned": number;
  "numAvailable": number;
  "purchaseDate": number;
  "items": LolCosmeticsCosmeticsTFTAugmentPillarViewModel[];
}
export interface LolCosmeticsTFTAugmentPillarGroupedViewModel {
  "selectedLoadoutItem": LolCosmeticsCosmeticsTFTAugmentPillarViewModel;
  "defaultItemId": number;
  "groups": LolCosmeticsTFTAugmentPillarGroupViewModel[];
}
export interface LolCosmeticsTFTDamageSkinFavoritesViewModel {
  "favoriteItems": LolCosmeticsCosmeticsTFTDamageSkinViewModel[];
}
export interface LolCosmeticsTFTDamageSkinGroupViewModel {
  "groupName": string;
  "groupId": number;
  "numOwned": number;
  "numAvailable": number;
  "purchaseDate": number;
  "items": LolCosmeticsCosmeticsTFTDamageSkinViewModel[];
}
export interface LolCosmeticsTFTDamageSkinGroupedViewModel {
  "selectedLoadoutItem": LolCosmeticsCosmeticsTFTDamageSkinViewModel;
  "defaultItemId": number;
  "groups": LolCosmeticsTFTDamageSkinGroupViewModel[];
  "resetLoadoutItem": LolCosmeticsCosmeticsTFTDamageSkinViewModel;
  "didResetSelection": boolean;
}
export interface LolCosmeticsTFTMapSkinFavoritesViewModel {
  "favoriteItems": LolCosmeticsCosmeticsTFTMapSkinViewModel[];
}
export interface LolCosmeticsTFTMapSkinGroupViewModel {
  "groupName": string;
  "groupId": number;
  "numOwned": number;
  "numAvailable": number;
  "purchaseDate": number;
  "items": LolCosmeticsCosmeticsTFTMapSkinViewModel[];
}
export interface LolCosmeticsTFTMapSkinGroupedViewModel {
  "selectedLoadoutItem": LolCosmeticsCosmeticsTFTMapSkinViewModel;
  "defaultItemId": number;
  "groups": LolCosmeticsTFTMapSkinGroupViewModel[];
  "resetLoadoutItem": LolCosmeticsCosmeticsTFTMapSkinViewModel;
  "didResetSelection": boolean;
}
export interface LolCosmeticsTFTPlaybookGroupViewModel {
  "groupName": string;
  "groupId": number;
  "numOwned": number;
  "numAvailable": number;
  "items": LolCosmeticsCosmeticsTFTPlaybookViewModel[];
}
export interface LolCosmeticsTFTPlaybookGroupedViewModel {
  "selectedLoadoutItem": LolCosmeticsCosmeticsTFTPlaybookViewModel;
  "defaultItemId": number;
  "groups": LolCosmeticsTFTPlaybookGroupViewModel[];
}
export interface LolCosmeticsTFTRotationalShopConfig {
  "enabled": boolean;
  "contentPreviewConfig": unknown;
  "uiToggleEnabled": boolean;
  "navs": LolCosmeticsTFTRotationalShopNavConfig[];
  "refund": LolCosmeticsTFTRotationalShopRefundConfig;
  "littleLegendsUpgradeEnabled": boolean;
  "eventsStoreEnabled": boolean;
  "eventsStoreData": unknown;
  "eventsMusicDisabled": boolean;
}
export interface LolCosmeticsTFTRotationalShopNavConfig {
  "name": string;
  "enabled": boolean;
  "supportedCurrencies": string[];
}
export interface LolCosmeticsTFTRotationalShopRefundConfig {
  "enabled": boolean;
  "allowedTypes": string[];
  "thresholdDays": number;
}
export interface LolCosmeticsTFTSettingsDataResource {
  "iconOverride": string;
}
export interface LolCosmeticsTFTSettingsResource {
  "data"?: LolCosmeticsTFTSettingsDataResource;
  "schemaVersion": number;
}
export interface LolCosmeticsTFTUCosmeticsSettings {
  "tacticians": string[];
  "arenas": string[];
  "booms": string[];
  "portals": string[];
  "schemaVersion": number;
}
export interface LolCosmeticsTFTUSettingsStorageContainer {
  "data": LolCosmeticsTFTUCosmeticsSettings;
  "schemaVersion": number;
}
export interface LolCosmeticsTFTZoomSkinFavoritesViewModel {
  "favoriteItems": LolCosmeticsCosmeticsTFTZoomSkinViewModel[];
}
export interface LolCosmeticsTFTZoomSkinGroupViewModel {
  "groupName": string;
  "groupId": number;
  "numOwned": number;
  "numAvailable": number;
  "purchaseDate": number;
  "items": LolCosmeticsCosmeticsTFTZoomSkinViewModel[];
}
export interface LolCosmeticsTFTZoomSkinGroupedViewModel {
  "selectedLoadoutItem": LolCosmeticsCosmeticsTFTZoomSkinViewModel;
  "defaultItemId": number;
  "groups": LolCosmeticsTFTZoomSkinGroupViewModel[];
  "resetLoadoutItem": LolCosmeticsCosmeticsTFTZoomSkinViewModel;
  "didResetSelection": boolean;
}
export interface LolCosmeticsTraKeyName {
  "nameTraKey": string;
  "translatedName": string;
}
export interface LolCosmeticsUserResource {
  "summonerId": number;
  "lol": Record<string, string>;
}
export interface LolCosmeticsVelocityLimitDeltaDto {
  "ruleId": string;
  "delta": number;
  "remaining": number;
}
export interface LolCosmeticsVelocityLimiterDto {
  "availableTokens": number;
  "refill": string;
}
export type LolDirectxUpgradeDirectXUpgradeNotificationType = "FUTURE_HARDWARE_UPGRADE" | "HARDWARE_UPGRADE" | "NONE";
export interface LolDirectxUpgradeLocalSettingsCategory {
  "data": unknown;
  "schemaVersion": number;
}
export interface LolDropsCapDropTableCounterDTO {
  "dropTableId": string;
  "count": number;
}
export interface LolDropsCapDropsDropTableDisplayMetadata {
  "isCollectorsBounty": boolean;
  "dataAssetId": string;
  "nameTraKey": string;
  "progressionId": string;
  "priority": number;
  "tables": Record<string, LolDropsOddsTableDisplayMetadata>;
  "version": number;
  "chaseContentId": string;
  "chaseContentIds": string[];
  "prestigeContentIds": string[];
  "bountyType": string;
  "oddsTree": LolDropsCapDropsOddsTreeNodeDTO;
}
export interface LolDropsCapDropsDropTableWithPityDTO {
  "id": string;
  "sourceId": string;
  "productId": string;
  "startDate": string;
  "endDate": string;
  "currencyId": string;
  "rollOffer": string;
  "cost": number;
  "displayMetadata": LolDropsCapDropsDropTableDisplayMetadata;
}
export interface LolDropsCapDropsOddsListEntryDTO {
  "contentId": string;
  "nodeId": string;
  "sourceId": string;
  "odds": number;
}
export interface LolDropsCapDropsOddsTreeNodeDTO {
  "nodeId": string;
  "sourceId": string;
  "odds": number;
  "children": LolDropsCapDropsOddsTreeNodeDTO[];
  "quantity": number;
  "nameTraKey": string;
  "priority": number;
}
export interface LolDropsOddsTableDisplayMetadata {
  "nameTraKey": string;
  "priority": number;
}
export interface LolEmailVerificationAccessToken {
  "token": string;
  "expiry": number;
}
export interface LolEmailVerificationEmailUpdate {
  "email": string;
  "password": string;
}
export interface LolEmailVerificationEmailVerificationSession {
  "email": string;
  "emailVerified": boolean;
  "fatalError": boolean;
}
export interface LolEmailVerificationRegionLocale {
  "region": string;
  "locale": string;
  "webRegion": string;
  "webLanguage": string;
}
export interface LolEmailVerificationRemoteEmailVerificationSession {
  "email": string;
  "emailVerified": boolean;
}
export interface LolEmailVerificationUserInfoEmailStatus {
  "emailVerified": boolean;
}
export interface LolEmailVerificationValidationStatus {
  "emailStatus": string;
}
export interface LolEndOfGameChampionMasteryGrade {
  "puuid": string;
  "championId": number;
  "grade": string;
}
export interface LolEndOfGameChampionMasteryMini {
  "puuid": string;
  "championId": number;
  "championLevel": number;
}
export interface LolEndOfGameChampionMasteryUpdate {
  "id": string;
  "gameId": number;
  "puuid": string;
  "championId": number;
  "hasLeveledUp": boolean;
  "level": number;
  "pointsBeforeGame": number;
  "pointsGained": number;
  "pointsGainedIndividualContribution": number;
  "bonusPointsGained": number;
  "pointsSinceLastLevelBeforeGame": number;
  "pointsUntilNextLevelBeforeGame": number;
  "pointsUntilNextLevelAfterGame": number;
  "tokensEarned": number;
  "tokenEarnedAfterGame": boolean;
  "grade": string;
  "score": number;
  "levelUpList": LolEndOfGameChampionMasteryMini[];
  "memberGrades": LolEndOfGameChampionMasteryGrade[];
}
export interface LolEndOfGameEndOfGameLifeTimeStatsRmsPayload {
  "gameId": number;
  "queueId": number;
  "wins": number;
  "losses": number;
}
export interface LolEndOfGameEndOfGamePlayer {
  "stats": unknown;
  "items": number[];
  "puuid": string;
  "riotIdGameName": string;
  "riotIdTagLine": string;
  "botPlayer": boolean;
  "championId": number;
  "gameId": number;
  "leaver": boolean;
  "wasAfk": boolean;
  "severeTransgressor": boolean;
  "leaves": number;
  "level": number;
  "losses": number;
  "profileIconId": number;
  "spell1Id": number;
  "spell2Id": number;
  "summonerName": string;
  "teamId": number;
  "wins": number;
  "summonerId": number;
  "selectedPosition": string;
  "detectedTeamPosition": string;
  "skinSplashPath": string;
  "skinTilePath": string;
  "skinEmblemPaths": string[];
  "championName": string;
  "championSquarePortraitPath": string;
  "isLocalPlayer": boolean;
}
export interface LolEndOfGameEndOfGamePoints {
  "pointChangeFromChampionsOwned": number;
  "pointChangeFromGameplay": number;
  "pointsUsed": number;
  "previousPoints": number;
  "pointsUntilNextReroll": number;
  "rerollCount": number;
  "totalPoints": number;
}
export interface LolEndOfGameEndOfGameRmsPayload {
  "additionalInfo": string;
  "infoType": string;
  "matchId": string;
  "preSignedUrl": string;
  "product": string;
  "sequenceNumber": number;
  "uri": string;
}
export interface LolEndOfGameEndOfGameStats {
  "difficulty": string;
  "gameId": number;
  "gameLength": number;
  "endOfGameTimestamp": number;
  "gameMode": string;
  "gameMutators": string[];
  "gameType": string;
  "invalid": boolean;
  "queueType": string;
  "ranked": boolean;
  "reportGameId": number;
  "multiUserChatId": string;
  "multiUserChatPassword": string;
  "mucJwtDto": LolEndOfGameMucJwtDto;
  "teams": LolEndOfGameEndOfGameTeam[];
  "localPlayer": LolEndOfGameEndOfGamePlayer;
  "myTeamStatus": string;
  "leveledUp": boolean;
  "newSpells": number[];
  "previousLevel": number;
  "rpEarned": number;
  "basePoints": number;
  "battleBoostIpEarned": number;
  "boostIpEarned": number;
  "firstWinBonus": number;
  "ipEarned": number;
  "ipTotal": number;
  "boostXpEarned": number;
  "experienceEarned": number;
  "experienceTotal": number;
  "globalBoostXpEarned": number;
  "loyaltyBoostXpEarned": number;
  "xbgpBoostXpEarned": number;
  "missionsXpEarned": number;
  "previousXpTotal": number;
  "nextLevelXp": number;
  "currentLevel": number;
  "preLevelUpExperienceTotal": number;
  "preLevelUpNextLevelXp": number;
  "timeUntilNextFirstWinBonus": number;
  "causedEarlySurrender": boolean;
  "earlySurrenderAccomplice": boolean;
  "teamEarlySurrendered": boolean;
  "gameEndedInEarlySurrender": boolean;
  "rerollData": LolEndOfGameEndOfGamePoints;
  "teamBoost"?: LolEndOfGameEndOfGameTeamBoost;
}
export interface LolEndOfGameEndOfGameTeam {
  "stats": unknown;
  "players": LolEndOfGameEndOfGamePlayer[];
  "memberStatusString": string;
  "name": string;
  "tag": string;
  "fullId": string;
  "teamId": number;
  "isBottomTeam": boolean;
  "isPlayerTeam": boolean;
  "isWinningTeam": boolean;
}
export interface LolEndOfGameEndOfGameTeamBoost {
  "summonerName": string;
  "skinUnlockMode": string;
  "price": number;
  "ipReward": number;
  "ipRewardForPurchaser": number;
  "availableSkins": number[];
  "unlocked": boolean;
}
export interface LolEndOfGameEndOfGamesChatRmsPayload {
  "gameId": number;
  "mucJwtDto": LolEndOfGameMucJwtDto;
}
export interface LolEndOfGameGameClientEndOfGame {
  "gameClientEOG": LolEndOfGameGameClientEndOfGameStats;
}
export interface LolEndOfGameGameClientEndOfGameStats {
  "gameId": number;
  "gameMode": string;
  "statsBlock": unknown;
  "queueId": number;
  "queueType": string;
  "isRanked": boolean;
}
export interface LolEndOfGameGameDataChampion {
  "id": number;
  "skins": LolEndOfGameGameDataChampionSkin[];
}
export interface LolEndOfGameGameDataChampionQuestSkin {
  "id": number;
  "splashPath": string;
  "tilePath": string;
}
export interface LolEndOfGameGameDataChampionSkin {
  "id": number;
  "splashPath": string;
  "tilePath": string;
  "chromas": LolEndOfGameGameDataSkinChroma[];
  "questSkinInfo": LolEndOfGameGameDataQuestSkinInfo;
}
export interface LolEndOfGameGameDataChampionSummary {
  "id": number;
  "alias": string;
  "name": string;
  "squarePortraitPath": string;
}
export interface LolEndOfGameGameDataCompanion {
  "contentId": string;
  "loadoutsIcon": string;
  "speciesName": string;
  "colorName": string;
}
export interface LolEndOfGameGameDataQuestSkinInfo {
  "tiers": LolEndOfGameGameDataChampionQuestSkin[];
}
export interface LolEndOfGameGameDataSkinChroma {
  "id": number;
}
export interface LolEndOfGameGameDataTFTChampion {
  "name": string;
  "character_record": LolEndOfGameGameDataTFTCharacterRecord;
}
export interface LolEndOfGameGameDataTFTCharacterRecord {
  "path": string;
  "character_id": string;
  "rarity": number;
  "display_name": string;
  "squareIconPath": string;
  "traits": LolEndOfGameGameDataTftTrait[];
}
export interface LolEndOfGameGameDataTftItem {
  "name": string;
  "id": number;
  "squareIconPath": string;
  "nameId": string;
}
export interface LolEndOfGameGameDataTftPlaybook {
  "itemId": number;
  "name": string;
  "translatedName": string;
  "iconPathSmall": string;
  "enabled": boolean;
}
export interface LolEndOfGameGameDataTftRegionPortal {
  "nameId": string;
  "iconPath": string;
  "displayName": string;
  "description": string;
}
export interface LolEndOfGameGameDataTftTrait {
  "id": string;
  "name": string;
}
export interface LolEndOfGameGameStateUpdate {
  "id": number;
  "gameState": string;
  "gameType": string;
  "errorMessage": string;
}
export interface LolEndOfGameGameflowAvailability {
  "state": string;
}
export interface LolEndOfGameGameflowClient {
  "observerServerIp": string;
  "observerServerPort": number;
  "running": boolean;
}
export interface LolEndOfGameGameflowGameData {
  "gameId": number;
  "queue": LolEndOfGameQueue;
}
export interface LolEndOfGameGameflowGameMap {
  "gameMutator": string;
}
export type LolEndOfGameGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolEndOfGameGameflowSession {
  "phase": LolEndOfGameGameflowPhase;
  "gameClient": LolEndOfGameGameflowClient;
  "gameData": LolEndOfGameGameflowGameData;
}
export interface LolEndOfGameInstallPaths {
  "gameInstallRoot": string;
  "gameExecutablePath": string;
  "tftInstallRoot": string;
}
export interface LolEndOfGameLobbyInvitation {
  "state": string;
}
export interface LolEndOfGameLoginSession {
  "state": LolEndOfGameLoginSessionStates;
  "summonerId": number;
  "accountId": number;
}
export type LolEndOfGameLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolEndOfGameMucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface LolEndOfGamePlayerReport {
  "offenderPuuid": string;
  "offenderSummonerId": number;
  "gameId": number;
  "categories": string[];
  "comment": string;
}
export interface LolEndOfGameQueue {
  "id": number;
  "type": string;
  "gameMode": string;
  "isRanked": boolean;
}
export interface LolEndOfGameRerollDataBagForClientV1 {
  "pointsGainedLastGame": number;
  "pointsUntilNextReroll": number;
  "rerollCount": number;
  "totalPoints": number;
  "maximumRerolls": number;
  "pointCostOfReroll": number;
}
export interface LolEndOfGameSummoner {
  "summonerId": number;
  "summonerLevel": number;
  "xpSinceLastLevel": number;
  "xpUntilNextLevel": number;
  "puuid": string;
}
export interface LolEndOfGameTFTEndOfGameCompanionViewModel {
  "speciesName": string;
  "colorName": string;
  "icon": string;
}
export interface LolEndOfGameTFTEndOfGameCustomAugmentContainerViewModel {
  "nameId": string;
  "iconPath": string;
  "displayName": string;
  "description": string;
}
export interface LolEndOfGameTFTEndOfGameEventPVEViewModel {
  "buddyName": string;
  "buddyIcon": string;
  "bossName": string;
  "affixes": string[];
}
export interface LolEndOfGameTFTEndOfGameItemViewModel {
  "name": string;
  "icon": string;
  "id": number;
  "nameId": string;
}
export interface LolEndOfGameTFTEndOfGamePieceViewModel {
  "championId": string;
  "name": string;
  "icon": string;
  "level": number;
  "price": number;
  "items": LolEndOfGameTFTEndOfGameItemViewModel[];
  "traits": LolEndOfGameTFTEndOfGameTraitViewModel[];
}
export interface LolEndOfGameTFTEndOfGamePlaybookViewModel {
  "itemId": number;
  "name": string;
  "iconSmall": string;
}
export interface LolEndOfGameTFTEndOfGamePlayerViewModel {
  "summonerId": number;
  "summonerName": string;
  "riotIdGameName": string;
  "riotIdTagLine": string;
  "iconId": number;
  "puuid": string;
  "ffaStanding": number;
  "health": number;
  "rank": number;
  "isLocalPlayer": boolean;
  "isInteractable": boolean;
  "partnerGroupId": number;
  "boardPieces": LolEndOfGameTFTEndOfGamePieceViewModel[];
  "augments": LolEndOfGameTFTEndOfGameItemViewModel[];
  "companion": LolEndOfGameTFTEndOfGameCompanionViewModel;
  "playbook": LolEndOfGameTFTEndOfGamePlaybookViewModel;
  "customAugmentContainer": LolEndOfGameTFTEndOfGameCustomAugmentContainerViewModel;
  "setCoreName": string;
}
export interface LolEndOfGameTFTEndOfGameSkillScoreTreeViewModel {
  "skillId": number;
  "score": number;
}
export interface LolEndOfGameTFTEndOfGameSkillTreeViewModel {
  "eventSkillToScore": LolEndOfGameTFTEndOfGameSkillScoreTreeViewModel[];
  "delta": number;
}
export interface LolEndOfGameTFTEndOfGameTraitViewModel {
  "id": string;
  "name": string;
}
export interface LolEndOfGameTFTEndOfGameViewModel {
  "players": LolEndOfGameTFTEndOfGamePlayerViewModel[];
  "localPlayer"?: LolEndOfGameTFTEndOfGamePlayerViewModel;
  "playerSkillTreeEoG"?: LolEndOfGameTFTEndOfGameSkillTreeViewModel;
  "eventPVEData"?: LolEndOfGameTFTEndOfGameEventPVEViewModel;
  "gameLength": number;
  "gameId": number;
  "queueId": number;
  "queueType": string;
  "isRanked": boolean;
}
export interface LolEsportStreamNotificationsESportStreamNotificationsConfig {
  "notificationsEnabled": boolean;
  "notificationsServiceEndpoint": string;
  "notificationsStreamURL": string;
  "notificationsStreamGroupSlug": string;
  "notificationsAssetMagickURL": string;
  "useServiceEndpointV2": boolean;
  "notificationsServiceEndpointV2": string;
  "notificationsShortPollMinutes": number;
  "notificationsLongPollMinutes": number;
  "beappFailureLongPollMinutes": number;
}
export interface LolEsportStreamNotificationsESportsAPI_streamgroups {
  "id": number;
  "slug": string;
  "title": string;
  "live": boolean;
  "content": string;
}
export interface LolEsportStreamNotificationsESportsAPI_streamgroups_root {
  "streamgroups": LolEsportStreamNotificationsESportsAPI_streamgroups[];
  "highlanderTournaments": LolEsportStreamNotificationsEsportsAPI_highlanderTournaments[];
  "teams": LolEsportStreamNotificationsEsportsAPI_teams[];
}
export interface LolEsportStreamNotificationsESportsLiveStreams {
  "liveStreams": LolEsportStreamNotificationsESportsStreams[];
}
export interface LolEsportStreamNotificationsESportsStreams {
  "title": string;
  "tournamentDescription": string;
  "teamAGuid": string;
  "teamAId": number;
  "teamBGuid": string;
  "teamBId": number;
  "teamAName": string;
  "teamBName": string;
  "teamAAcronym": string;
  "teamBAcronym": string;
  "teamALogoUrl": string;
  "teamBLogoUrl": string;
}
export interface LolEsportStreamNotificationsEsportsAPI_highlanderTournaments {
  "id": string;
  "description": string;
  "title": string;
  "brackets": Record<string, LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_brackets>;
  "rosters": Record<string, LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_rosters>;
}
export interface LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_brackets {
  "id": string;
  "matches": Record<string, LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_matches>;
}
export interface LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_matches {
  "id": string;
  "input": LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_roster[];
}
export interface LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_roster {
  "roster": string;
}
export interface LolEsportStreamNotificationsEsportsAPI_highlanderTournaments_rosters {
  "id": string;
  "name": string;
  "team": number;
}
export interface LolEsportStreamNotificationsEsportsAPI_teams {
  "id": number;
  "guid": string;
  "slug": string;
  "name": string;
  "logoUrl": string;
  "acronym": string;
}
export type LolEsportStreamNotificationsGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolEsportStreamNotificationsGameflowSession {
  "phase": LolEsportStreamNotificationsGameflowPhase;
}
export interface LolEsportStreamNotificationsLiveMatch {
  "id": string;
  "streamGroup": string;
  "title": string;
  "tournamentDescription": string;
  "teams": LolEsportStreamNotificationsLiveMatchTeam[];
}
export interface LolEsportStreamNotificationsLiveMatchTeam {
  "guid": string;
  "name": string;
  "acronym": string;
  "logoUrl": string;
}
export interface LolEsportStreamNotificationsPlayerNotificationResource {
  "backgroundUrl": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolEventHubAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolEventHubActivationClientConfig {
  "hubEnabled": boolean;
  "activationSpreadSeconds": number;
  "firstActivationThresholdSeconds": number;
  "activeEventId": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
}
export interface LolEventHubActiveEventUIData {
  "eventId": string;
  "eventInfo": LolEventHubEventInfoUIData;
}
export interface LolEventHubActivityCenterMilestones {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "isGameModeEvent": boolean;
  "queueId": number;
  "localizedLogo": string;
  "localizedEventSubtitle": string;
  "localizedHelpUrl": string;
  "backgroundImage": string;
  "helpModalImage": string;
  "objectiveBannerImage": string;
  "objectiveCard": LolEventHubObjectiveCard;
  "eventPassBundlesCatalogEntry": LolEventHubCatalogEntry[];
  "rewardTrack": LolEventHubRewardTrack;
}
export interface LolEventHubBalance {
  "currencyType": string;
  "amount": number;
}
export interface LolEventHubBaseSkinLineDto {
  "items": LolEventHubSkinLineItemDto[];
  "localizedName": string;
  "skinLineDescriptions": LolEventHubSkinLineDescriptionDto[];
  "pricingOptions": LolEventHubPriceOptionDto[];
  "splashPath": string;
  "uncenteredSplashPath": string;
  "collectionCardPath": string;
  "collectionDescription": string;
  "tilePath": string;
}
export interface LolEventHubBundleOfferUIData {
  "details": LolEventHubBundledItemUIData;
  "initialPrice": number;
  "finalPrice": number;
  "futureBalance": number;
  "isPurchasable": boolean;
  "discountPercentage": number;
  "bundledItems": LolEventHubBundledItemUIData[];
}
export interface LolEventHubBundledItemPricingInfo {
  "discountPrices": LolEventHubDiscountPricingInfo[];
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
}
export interface LolEventHubBundledItemUIData {
  "name": string;
  "itemId": number;
  "description": string;
  "inventoryType": string;
  "subInventoryType": string;
  "splashImage": string;
  "owned": boolean;
  "quantity": number;
  "decoratorBadgeURL": string;
}
export interface LolEventHubCapOffer {
  "id": string;
  "typeId": string;
  "label": string;
  "productId": string;
  "merchantId": string;
  "payload": LolEventHubCapOfferPayloadEntry[];
  "active": boolean;
  "startDate": string;
  "createdDate": string;
}
export interface LolEventHubCapOfferPayloadEntry {
  "itemPriceMap": Record<string, number>;
  "itemInstanceId": string;
  "fulfillmentTypeId": string;
  "inventoryTypeUUID": string;
}
export interface LolEventHubCapOrdersDataDto {
  "id": string;
  "subOrders": LolEventHubCapOrdersSubOrderDto[];
  "purchaser": LolEventHubCapOrdersTypedIdentifierDto;
  "location": string;
  "source": string;
}
export interface LolEventHubCapOrdersMetaDto {
  "xid": string;
}
export interface LolEventHubCapOrdersOfferContextDto {
  "quantity": number;
  "paymentOption": string;
}
export interface LolEventHubCapOrdersOfferDto {
  "id": string;
  "productId": string;
}
export interface LolEventHubCapOrdersOrderDto {
  "data": LolEventHubCapOrdersDataDto;
  "meta": LolEventHubCapOrdersMetaDto;
}
export interface LolEventHubCapOrdersSubOrderDto {
  "recipientId": string;
  "offerContext": LolEventHubCapOrdersOfferContextDto;
  "offer": LolEventHubCapOrdersOfferDto;
}
export interface LolEventHubCapOrdersTypedIdentifierDto {
  "id": string;
  "typeId": string;
}
export interface LolEventHubCatalogEntry {
  "contentId": string;
  "itemId": number;
  "offerId": string;
  "typeId": string;
}
export interface LolEventHubCatalogItem {
  "itemId": number;
  "inventoryType": string;
  "itemInstanceId"?: string;
}
export interface LolEventHubCatalogPluginItem {
  "itemId": number;
  "itemInstanceId": string;
  "owned": boolean;
  "inventoryType": string;
  "subInventoryType": string;
  "name": string;
  "subTitle": string;
  "description": string;
  "imagePath": string;
  "purchaseDate": number;
  "releaseDate": number;
  "inactiveDate": number;
  "duration": number;
  "maxQuantity": number;
  "prices": LolEventHubCatalogPluginPrice[];
  "tags"?: string[];
  "metadata"?: LolEventHubItemMetadataEntry[];
  "questSkinInfo"?: LolEventHubSkinLineInfo;
  "active": boolean;
  "sale"?: LolEventHubSale;
  "ownershipType"?: LolEventHubInventoryOwnership;
}
export interface LolEventHubCatalogPluginItemAssets {
  "splashPath": string;
  "iconPath": string;
  "tilePath": string;
  "previewVideoUrl": string;
  "emblems": LolEventHubChampionSkinEmblem[];
  "colors": string[];
}
export interface LolEventHubCatalogPluginItemWithDetails {
  "item": LolEventHubCatalogPluginItem;
  "quantity": number;
  "requiredItems"?: LolEventHubCatalogPluginItemWithDetails[];
  "bundledItems"?: LolEventHubCatalogPluginItemWithDetails[];
  "minimumBundlePrices"?: LolEventHubCatalogPluginPrice[];
  "bundledDiscountPrices"?: LolEventHubCatalogPluginPrice[];
  "assets": LolEventHubCatalogPluginItemAssets;
  "bundleFinalPrice": number;
  "flexible": boolean;
}
export interface LolEventHubCatalogPluginPrice {
  "currency": string;
  "cost": number;
  "costType"?: string;
  "sale"?: LolEventHubCatalogPluginSale;
}
export interface LolEventHubCatalogPluginSale {
  "startDate": string;
  "endDate": string;
  "discount"?: number;
  "cost": number;
}
export interface LolEventHubCategoryOffersUIData {
  "category": LolEventHubOfferCategory;
  "categoryIconPath": string;
  "offers": LolEventHubOfferUIData[];
}
export type LolEventHubCelebrationType = "FULLSCREEN" | "NONE" | "TOAST";
export interface LolEventHubChampionSkinEmblem {
  "name": string;
  "emblemPath": LolEventHubChampionSkinEmblemPath;
  "emblemPosition": LolEventHubChampionSkinEmblemPosition;
}
export interface LolEventHubChampionSkinEmblemPath {
  "large": string;
  "small": string;
}
export interface LolEventHubChampionSkinEmblemPosition {
  "vertical": string;
  "horizontal": string;
}
export interface LolEventHubChapter {
  "localizedTitle": string;
  "localizedDescription": string;
  "cardImage": string;
  "backgroundImage": string;
  "objectiveBannerImage": string;
  "chapterStart": number;
  "chapterEnd": number;
  "chapterNumber": number;
  "levelFocus": number;
}
export interface LolEventHubChaptersUIData {
  "currentChapter": number;
  "chapters": LolEventHubChapter[];
}
export interface LolEventHubClientCacheClearMessageDTO {
  "regions": string[];
  "clearAll": boolean;
  "inventoryTypes": string[];
}
export interface LolEventHubContentDrop {
  "patch": string;
  "activationDate": string;
  "offers": LolEventHubOffer[];
}
export interface LolEventHubContentDropClientConfig {
  "patch": string;
  "activationDate": string;
}
export interface LolEventHubCounter {
  "id": string;
  "name": string;
  "groupId": string;
  "direction": string;
  "startValue": number;
}
export interface LolEventHubCounterInstance {
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "counterValue": number;
}
export interface LolEventHubCurrencyDTO {
  "amount": number;
  "subCurrencies": Record<string, number>;
}
export interface LolEventHubDemaciaPass {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "helpModalImage": string;
  "objectiveBannerImage": string;
  "eventPassBundlesCatalogEntry": LolEventHubCatalogEntry[];
  "rewardTrack": LolEventHubRewardTrack;
  "tokenBankTrack": LolEventHubRewardTrack;
  "tokenCurrency": LolEventHubLolCurrency;
}
export interface LolEventHubDiscountPricingInfo {
  "cost": number;
  "originalCost": number;
  "costType": string;
  "currency": string;
  "discount": number;
}
export interface LolEventHubEndOfGameXp {
  "PER_WIN": number;
}
export interface LolEventHubEndOfGameXpNotification {
  "xp": LolEventHubEndOfGameXp;
}
export interface LolEventHubEntityInstance {
  "schemaVersion": string;
  "groupId": string;
  "counters": LolEventHubCounterInstance[];
  "milestones": LolEventHubMilestoneInstance[];
}
export interface LolEventHubEventBackgroundUIData {
  "backgroundImagePath": string;
}
export interface LolEventHubEventDetailsUIData {
  "eventIconPath": string;
  "eventName": string;
  "headerTitleImagePath": string;
  "progressEndDate": string;
  "shopEndDate": string;
  "eventStartDate": string;
  "helpModalImagePath": string;
  "inducteeName": string;
  "promotionBannerImage": string;
  "objectiveBannerImage": string;
  "memoryBookBackgroundImage": string;
  "spotlightSkinId": number;
  "actBackgroundImage": string;
}
export interface LolEventHubEventHubError {
  "errorMessage": string;
  "errorId": string;
}
export type LolEventHubEventHubType = "ActivityCenterMilestones" | "DemaciaPass" | "EventShop" | "HallOfLegends" | "SeasonPass";
export interface LolEventHubEventInfoUIData {
  "eventId": string;
  "eventName": string;
  "eventType": string;
  "eventIcon": string;
  "navBarIcon": string;
  "battleExpIcon": string;
  "localizedShortName": string;
  "eventTokenImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "seasonPassSubType": LolEventHubSeasonPassSubType;
  "localizedLogo": string;
  "localizedEventSubtitle": string;
  "localizedHelpUrl": string;
  "objectiveCard": LolEventHubObjectiveCard;
  "currentTokenBalance": number;
  "lockedTokenCount": number;
  "unclaimedRewardCount": number;
  "timeOfLastUnclaimedReward": number;
  "isPassPurchased": boolean;
  "isGameModeEvent": boolean;
  "queueId": number;
  "eventPassBundles": LolEventHubCatalogEntry[];
  "tokenBundles": LolEventHubCatalogEntry[];
}
export interface LolEventHubEventOverrideData {
  "eventActive": boolean;
  "eventStartDate": string;
  "eventProgressEndDate": string;
  "eventEndDate": string;
}
export interface LolEventHubEventPassInfo {
  "eventId": string;
  "isPassPurchased": boolean;
}
export interface LolEventHubEventShop {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "backgroundImage": string;
  "navbarIconImage": string;
  "headerIconImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "localizedUpsellTitle": string;
  "localizedUpsellTooltipTitle": string;
  "localizedUpsellTooltipDescription": string;
  "localizedUpsellButtonText": string;
  "upsellBackgroundImageUrl": string;
  "upsellTooltipBackgroundImageUrl": string;
  "helpModalImage": string;
  "eventPassBundlesCatalogEntry": LolEventHubCatalogEntry[];
  "tokenShop": LolEventHubTokenShop;
  "rewardTrack": LolEventHubRewardTrack;
}
export interface LolEventHubEventShopClientConfig {
  "disabledOfferIds": string[];
  "contentDrops": LolEventHubContentDropClientConfig[];
}
export type LolEventHubExternalCatalogInventoryOwnership = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolEventHubExternalCatalogItemCost {
  "currency": string;
  "cost": number;
  "discount"?: number;
}
export interface LolEventHubExternalCatalogItemKey {
  "inventoryType": string;
  "itemId": number;
}
export interface LolEventHubExternalCatalogPluginItem {
  "itemId": number;
  "itemInstanceId": string;
  "owned": boolean;
  "ownershipType"?: LolEventHubExternalCatalogInventoryOwnership;
  "inventoryType": string;
  "subInventoryType": string;
  "name": string;
  "subTitle": string;
  "description": string;
  "imagePath": string;
  "tilePath": string;
  "purchaseDate": number;
  "releaseDate": number;
  "inactiveDate": number;
  "prices": LolEventHubExternalCatalogPluginPrice[];
  "tags"?: string[];
  "active": boolean;
  "sale"?: LolEventHubExternalCatalogSale;
  "offerId"?: string;
}
export interface LolEventHubExternalCatalogPluginItemAssets {
  "splashPath": string;
  "iconPath": string;
  "tilePath": string;
  "colors": string[];
}
export interface LolEventHubExternalCatalogPluginItemWithDetails {
  "item": LolEventHubExternalCatalogPluginItem;
  "quantity": number;
  "requiredItems"?: LolEventHubExternalCatalogPluginItemWithDetails[];
  "bundledItems"?: LolEventHubExternalCatalogPluginItemWithDetails[];
  "minimumBundlePrices"?: LolEventHubExternalCatalogPluginPrice[];
  "bundledDiscountPrices"?: LolEventHubExternalCatalogPluginPrice[];
  "metadata": LolEventHubExternalItemMetadataEntry[];
}
export interface LolEventHubExternalCatalogPluginPrice {
  "currency": string;
  "cost": number;
  "costType"?: string;
  "sale"?: LolEventHubExternalCatalogPluginRetailDiscount;
}
export interface LolEventHubExternalCatalogPluginRetailDiscount {
  "startDate": string;
  "endDate": string;
  "discount"?: number;
  "cost": number;
}
export interface LolEventHubExternalCatalogSale {
  "startDate": string;
  "endDate": string;
  "prices": LolEventHubExternalCatalogItemCost[];
}
export interface LolEventHubExternalItemMetadataEntry {
  "type": string;
  "value": string;
}
export interface LolEventHubFSC {
  "id": string;
  "canvas": LolEventHubFSCCanvas;
  "media": LolEventHubFSCMedia;
  "rewards": LolEventHubFSCRewards[];
}
export interface LolEventHubFSCCanvas {
  "title": string;
  "subtitle": string;
  "description": string;
  "canvasBackgroundImage": string;
  "canvasSize": LolEventHubFSCCanvasSize;
  "canvasDesign": string;
  "buttonText": string;
}
export type LolEventHubFSCCanvasSize = "FULL" | "LARGE" | "MEDIUM" | "SMALL";
export interface LolEventHubFSCMedia {
  "introAnimation": string;
  "introAnimationAudio": string;
  "introLowSpecImage": string;
  "loopAnimation": string;
  "loopAnimationAudio": string;
  "transitionAnimation": string;
  "transitionAnimationAudio": string;
}
export interface LolEventHubFSCRewards {
  "itemId": number;
  "image": string;
  "imageOverlay": string;
  "title": string;
  "subtitle": string;
}
export type LolEventHubGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolEventHubGrantorDescription {
  "appName": string;
  "entityId": string;
}
export interface LolEventHubGroup {
  "id": string;
  "schemaVersion": string;
  "productId": string;
  "name": string;
  "repeat": LolEventHubRepeat;
  "counters": LolEventHubCounter[];
  "milestones": LolEventHubMilestone[];
}
export interface LolEventHubHallOfLegends {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "headerIconImage": string;
  "battleExpIconImage": string;
  "headerTitleImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "helpModalImage": string;
  "inducteeName": string;
  "spotlightSkin": LolEventHubSpotlightSkin;
  "promotionBannerImage": string;
  "objectiveBannerImage": string;
  "eventPassBundlesCatalogEntry": LolEventHubCatalogEntry[];
  "progressionPurchaseCatalogEntry": LolEventHubCatalogEntry;
  "skinIds": string[];
  "rewardTrack": LolEventHubRewardTrack;
  "narrativeElements": LolEventHubNarrativeElement[];
  "localizedUpsellTitle": string;
  "localizedUpsellTooltipTitle": string;
  "localizedUpsellTooltipDescription": string;
  "localizedUpsellButtonText": string;
  "upsellBackgroundImageUrl": string;
  "upsellTooltipBackgroundImageUrl": string;
  "upsellIconUrl": string;
  "memoryBookBackgroundImage": string;
}
export interface LolEventHubHallOfLegendsClientConfig {
  "narrativeElements": LolEventHubNarrativeElement[];
}
export interface LolEventHubInventoryCacheEntry {
  "signedInventoryJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolEventHubInventoryDTO {
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "items": Record<string, unknown>;
  "expires": string;
  "itemsJwt": string;
}
export interface LolEventHubInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolEventHubItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "wins": number;
}
export interface LolEventHubInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "ownedQuantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "payload": unknown;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "lsb": boolean;
  "wins": number;
}
export interface LolEventHubInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolEventHubItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "owned": boolean;
  "wins": number;
  "payload": unknown;
}
export interface LolEventHubInventoryNotification {
  "id": number;
  "itemId": number;
  "inventoryType": string;
  "type": string;
  "acknowledged": boolean;
}
export type LolEventHubInventoryOwnership = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolEventHubInventoryResponseDTO {
  "data": LolEventHubInventoryDTO;
}
export interface LolEventHubItem {
  "itemId": string;
  "inventoryType": string;
  "price": number;
  "quantity": number;
}
export interface LolEventHubItemChoiceDetails {
  "item": LolEventHubCatalogPluginItem;
  "backgroundImage": string;
  "contents": LolEventHubItemDetails[];
  "discount": string;
  "fullPrice": number;
  "displayType": string;
  "purchaseOptions": LolEventHubPurchaseOption[];
}
export interface LolEventHubItemChoices {
  "choices": LolEventHubItemChoiceDetails[];
  "validationErrors": LolEventHubValidationErrorEntry[];
}
export interface LolEventHubItemCost {
  "currency": string;
  "cost": number;
  "discount"?: number;
}
export interface LolEventHubItemDefinition {
  "itemId": number;
  "itemInstanceId": string;
  "inventoryType": string;
  "subInventoryType": string;
  "name": string;
  "description": string;
  "subTitle": string;
  "imagePath": string;
  "owned": boolean;
  "assets": LolEventHubCatalogPluginItemAssets;
  "tags": string[];
  "metadata": LolEventHubItemMetadataEntry[];
  "duration": number;
  "bundledItemPrice"?: LolEventHubBundledItemPricingInfo;
  "loyaltyUnlocked": boolean;
  "hasVisibleLootOdds": boolean;
  "inactiveDate": number;
}
export interface LolEventHubItemDetails {
  "title": string;
  "subTitle": string;
  "description": string;
  "iconUrl": string;
}
export interface LolEventHubItemKey {
  "itemId": number;
  "inventoryType": string;
  "subInventoryType": string;
}
export interface LolEventHubItemMetadataEntry {
  "type": string;
  "value": string;
}
export interface LolEventHubItemOrderDTO {
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
  "rpCost": number;
}
export interface LolEventHubItemOwnership {
  "itemKey": LolEventHubItemKey;
  "quantity": number;
}
export type LolEventHubItemOwnershipType = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolEventHubItemPrice {
  "currencyType": string;
  "price": number;
  "originalPrice": number;
  "purchasable": boolean;
}
export interface LolEventHubItemSale {
  "startDate": string;
  "endDate": string;
  "discount"?: number;
}
export interface LolEventHubItemUIData {
  "itemId": string;
  "inventoryType": string;
  "price": number;
  "quantity": number;
}
export interface LolEventHubLoginSession {
  "puuid"?: string;
  "state": LolEventHubLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
}
export type LolEventHubLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolEventHubLolCurrency {
  "capCurrencyId": string;
  "lolCurrencyId": string;
}
export interface LolEventHubLolInventoryType {
  "inventoryTypeId": string;
  "capInventoryTypeId": string;
}
export interface LolEventHubLoyaltyRewards {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": Record<string, number>;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export interface LolEventHubLoyaltyRewardsSimplified {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": number;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export type LolEventHubLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolEventHubLoyaltyStatusNotification {
  "status": LolEventHubLoyaltyStatus;
  "rewards": LolEventHubLoyaltyRewardsSimplified;
  "reloadInventory": boolean;
}
export interface LolEventHubMilestone {
  "id": string;
  "name": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "properties": Record<string, string>;
  "triggers": LolEventHubTrigger[];
  "triggerRequirement": string;
}
export interface LolEventHubMilestoneInstance {
  "milestoneId": string;
  "instanceId": string;
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "repeatSequence": number;
  "triggered": boolean;
  "triggeredTimestamp": string;
  "triggers": LolEventHubTrigger[];
}
export interface LolEventHubNarrativeElement {
  "localizedNarrativeTitle": string;
  "localizedNarrativeDescription": string;
  "narrativeBackgroundImage": string;
  "narrativeStartingTrackLevel": number;
  "narrativeVideo": LolEventHubNarrativeVideo;
}
export interface LolEventHubNarrativeVideo {
  "localizedNarrativeVideoUrl": string;
  "localizedPlayNarrativeButtonLabel": string;
  "localizedVideoTitle": string;
  "thumbnailImage": string;
  "narrativeVideoIsLockedOnLevel"?: boolean;
  "localizedNarrativeVideoDescription": string;
}
export interface LolEventHubNavigationButtonUIData {
  "activeEventId": string;
  "showPip": boolean;
  "showGlow": boolean;
  "iconPath": string;
  "eventName": string;
  "eventType": string;
}
export interface LolEventHubNextRewardUIData {
  "thumbIconPath": string;
  "state": LolEventHubRewardTrackItemHeaderType;
  "name": string;
  "description": string;
  "level": string;
}
export interface LolEventHubObjectiveCard {
  "missionSeriesName": string;
  "objectiveGroup": string;
  "objectiveCategoryId": string;
}
export interface LolEventHubObjectivesBanner {
  "eventName": string;
  "promotionBannerImage": string;
  "objectiveBannerImage": string;
  "eventEndDate": string;
  "eventProgressEndDate": string;
  "isPassPurchased": boolean;
  "tokenBalance": number;
  "token": LolEventHubLolCurrency;
  "currentChapter": LolEventHubChapter;
  "trackProgressNextReward": LolEventHubTrackProgressNextReward;
  "trackProgress": LolEventHubTrackProgressNextReward;
  "rewardTrackProgress": LolEventHubRewardTrackProgress;
}
export interface LolEventHubOffer {
  "id": string;
  "localizedTitle": string;
  "localizedDescription": string;
  "image": string;
  "promotionType": LolEventHubOfferPromotionType;
  "offerCategory": LolEventHubOfferCategory;
  "items": LolEventHubItem[];
}
export type LolEventHubOfferCategory = "Borders" | "Chromas" | "Currencies" | "Featured" | "Loot" | "Skins" | "Tft";
export type LolEventHubOfferPromotionType = "kFeatured" | "kFeaturedHighlighted" | "kNone";
export type LolEventHubOfferStates = "kAvailable" | "kOwned" | "kPurchasing" | "kUnavailable" | "kUnrevealed";
export interface LolEventHubOfferUIData {
  "id": string;
  "localizedTitle": string;
  "localizedDescription": string;
  "image": string;
  "highlighted": boolean;
  "offerState": LolEventHubOfferStates;
  "price": number;
  "maxQuantity": number;
  "items": LolEventHubItemUIData[];
}
export interface LolEventHubOrderNotificationResource {
  "eventTypeId": string;
  "eventType": string;
  "status": string;
}
export interface LolEventHubPlayerNotification {
  "critical": boolean;
  "detailKey": string;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
  "iconUrl": string;
}
export interface LolEventHubPlayerSettingsData {
  "lastTimeSeen": string;
  "lastSeenTokenBalance": number;
  "lastSeenTokenShopOffersVersion": number;
}
export interface LolEventHubPlayerSettingsDataMap {
  "playerSettingsDataMap": Record<string, LolEventHubPlayerSettingsData>;
}
export interface LolEventHubPremiumEntitlement {
  "contentId": string;
}
export interface LolEventHubPriceDetail {
  "itemKey": LolEventHubItemKey;
  "price": LolEventHubItemPrice;
}
export interface LolEventHubPriceOptionDto {
  "price": number;
  "currencyType": string;
  "currencyPaymentOption"?: string;
  "currencyName"?: string;
  "currencyImagePath"?: string;
}
export interface LolEventHubProgressInfoUIData {
  "tokenImage": string;
  "passPurchased": boolean;
  "eventPassBundlesCatalogEntry": LolEventHubCatalogEntry[];
}
export interface LolEventHubProgressionPurchaseUIData {
  "offerId": string;
  "pricePerLevel": number;
  "rpBalance": number;
  "itemId": number;
  "inventoryType": string;
}
export interface LolEventHubPurchasableItem {
  "item": LolEventHubItemDefinition;
  "dependencies": LolEventHubItemDefinition[];
  "bundledItems": LolEventHubItemDefinition[];
  "sale"?: LolEventHubItemSale;
  "purchaseOptions": LolEventHubPurchaseOption[];
  "validationErrors": LolEventHubValidationErrorEntry[];
}
export interface LolEventHubPurchaseItem {
  "itemKey": LolEventHubItemKey;
  "quantity": number;
  "source": string;
  "purchaseCurrencyInfo": LolEventHubItemPrice;
}
export type LolEventHubPurchaseOfferOrderStates = "FAIL" | "IN_PROGRESS" | "NOT_STARTED" | "SUCCESS";
export interface LolEventHubPurchaseOfferOrderStatus {
  "orderState": LolEventHubPurchaseOfferOrderStates;
  "message": string;
}
export interface LolEventHubPurchaseOfferOrderStatuses {
  "statuses": Record<string, LolEventHubPurchaseOfferOrderStatus>;
}
export interface LolEventHubPurchaseOfferRequest {
  "offerId": string;
  "purchaseQuantity": number;
  "itemId": number;
  "inventoryType": string;
  "rpPrice": number;
}
export interface LolEventHubPurchaseOfferRequestV3 {
  "offerId": string;
  "currencyType": string;
  "quantity": number;
  "price": number;
}
export interface LolEventHubPurchaseOfferResponseV3 {
  "legacy": boolean;
  "orderDto"?: LolEventHubCapOrdersOrderDto;
}
export interface LolEventHubPurchaseOption {
  "priceDetails": LolEventHubPriceDetail[];
}
export interface LolEventHubPurchaseOrderResponseDTO {
  "rpBalance": number;
  "ipBalance": number;
  "transactions": LolEventHubTransactionResponseDTO[];
}
export interface LolEventHubPurchaseRequest {
  "items": LolEventHubPurchaseItem[];
}
export interface LolEventHubPurchaseResponse {
  "items": LolEventHubPurchaseItem[];
  "transactions": LolEventHubTransaction[];
  "useRMSConfirmation": boolean;
}
export interface LolEventHubPurchaseWidgetConfig {
  "enabled": boolean;
  "nonRefundableDisclaimerEnabled": boolean;
  "alwaysShowPurchaseDisclaimer": boolean;
}
export interface LolEventHubRMSPayload {
  "productId": string;
  "affinities": string[];
}
export interface LolEventHubRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolEventHubRepeat {
  "count": number;
  "scope": number;
  "multiplier": number;
  "milestones": LolEventHubMilestone[];
  "repeatTriggers": LolEventHubRepeatGroupTrigger[];
}
export interface LolEventHubRepeatGroupTrigger {
  "type": string;
  "counterId": string;
  "startTriggerValue": number;
  "increaseBy": number;
  "multiplier": number;
}
export interface LolEventHubRequestDTO_SelectionRequestDTO {
  "data": LolEventHubSelectionRequestDTO;
  "metadata": LolEventHubRequestMetadataDTO;
}
export interface LolEventHubRequestDTO_vector_SelectionRequestDTO {
  "data": LolEventHubSelectionRequestDTO[];
  "metadata": LolEventHubRequestMetadataDTO;
}
export interface LolEventHubRequestDTO_vector_string {
  "data": string[];
  "metadata": LolEventHubRequestMetadataDTO;
}
export interface LolEventHubRequestMetadataDTO {
  "transactionId"?: string;
}
export interface LolEventHubResponseDTO_SvcRewardGrant {
  "data": LolEventHubSvcRewardGrant;
  "metadata": LolEventHubResponseMetadataDTO;
}
export interface LolEventHubResponseDTO_map_RewardGroupId_SelectGrantStatus {
  "data": Record<string, LolEventHubSelectGrantStatusResponse>;
  "metadata": LolEventHubResponseMetadataDTO;
}
export interface LolEventHubResponseDTO_vector_SvcRewardGrant {
  "data": LolEventHubSvcRewardGrant[];
  "metadata": LolEventHubResponseMetadataDTO;
}
export interface LolEventHubResponseDTO_vector_SvcRewardGroup {
  "data": LolEventHubSvcRewardGroup[];
  "metadata": LolEventHubResponseMetadataDTO;
}
export interface LolEventHubResponseMetadataDTO {
}
export interface LolEventHubReward {
  "id": string;
  "itemId": string;
  "itemType": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolEventHubRewardGrant {
  "info": LolEventHubSvcRewardGrant;
  "rewardGroup": LolEventHubSvcRewardGroup;
}
export type LolEventHubRewardStatus = "FAILED" | "FULFILLED" | "PENDING";
export type LolEventHubRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolEventHubRewardTrack {
  "trackConfig": LolEventHubRewardTrackConfiguration;
}
export interface LolEventHubRewardTrackConfiguration {
  "id": string;
  "premiumEntitlement": LolEventHubPremiumEntitlement;
}
export interface LolEventHubRewardTrackError {
  "errorMessage": string;
  "errorId": string;
}
export interface LolEventHubRewardTrackItem {
  "state": LolEventHubRewardTrackItemStates;
  "rewardOptions": LolEventHubRewardTrackItemOption[];
  "rewardTags": LolEventHubRewardTrackItemTag[];
  "progressRequired": number;
  "threshold": string;
}
export type LolEventHubRewardTrackItemHeaderType = "FREE" | "NONE" | "PREMIUM";
export interface LolEventHubRewardTrackItemOption {
  "state": LolEventHubRewardTrackItemStates;
  "thumbIconPath": string;
  "splashImagePath": string;
  "selected": boolean;
  "overrideFooter": string;
  "headerType": LolEventHubRewardTrackItemHeaderType;
  "rewardName": string;
  "rewardDescription": string;
  "rewardItemType": string;
  "rewardItemId": string;
  "rewardFulfillmentSource": string;
  "cardSize": string;
  "rewardGroupId": string;
  "celebrationType": LolEventHubCelebrationType;
  "rewardInventoryTypes": string[];
}
export type LolEventHubRewardTrackItemStates = "Locked" | "Selected" | "Unlocked" | "Unselected";
export type LolEventHubRewardTrackItemTag = "Choice" | "Free" | "Instant" | "Multiple" | "Rare";
export interface LolEventHubRewardTrackProgress {
  "level": number;
  "totalLevels": number;
  "levelProgress": number;
  "futureLevelProgress": number;
  "passProgress": number;
  "currentLevelXP": number;
  "totalLevelXP": number;
  "iteration": number;
}
export interface LolEventHubRewardTrackXP {
  "currentLevel": number;
  "currentLevelXP": number;
  "totalLevelXP": number;
  "isBonusPhase": boolean;
  "iteration": number;
}
export interface LolEventHubRewardsCatalogPluginItem {
  "itemId": number;
  "name": string;
  "itemInstanceId": string;
  "owned": boolean;
  "rarity": string;
  "active": boolean;
  "questSkinInfo": LolEventHubRewardsSkinLineInfo;
}
export interface LolEventHubRewardsCatalogPluginItemAssets {
  "splashPath": string;
  "loadScreenPath": string;
}
export interface LolEventHubRewardsCatalogPluginItemWithDetails {
  "item": LolEventHubRewardsCatalogPluginItem;
  "assets": LolEventHubRewardsCatalogPluginItemAssets;
}
export interface LolEventHubRewardsConfig {
  "GrantFiltering": boolean;
}
export interface LolEventHubRewardsSkinLineInfo {
  "tiers": LolEventHubRewardsSkinLineTier[];
  "mostProgressedSkinTier": LolEventHubRewardsSkinLineTier;
  "productType": string;
}
export interface LolEventHubRewardsSkinLineTier {
  "stage": number;
  "name": string;
  "uncenteredSplashPath": string;
  "ownership": LolEventHubRewardsSkinLineTierOwnership;
}
export interface LolEventHubRewardsSkinLineTierOwnership {
  "owned": boolean;
}
export interface LolEventHubRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolEventHubRmsEntitlementPayload {
  "itemId": string;
  "itemTypeId": string;
  "tiers": string;
  "entitlementTypeId": string;
  "resourceOperation": string;
}
export interface LolEventHubRmsStoreEntitlementItem {
  "inventoryType": string;
  "itemId": string;
}
export interface LolEventHubRmsStoreEntitlementPayload {
  "transactionId": string;
  "items": LolEventHubRmsStoreEntitlementItem[];
}
export interface LolEventHubRmsWalletPayload {
}
export interface LolEventHubRmsXboxSubscriptionChange {
  "puuid": string;
  "subscriptionId": string;
  "active": string;
  "identityProvider": string[];
}
export interface LolEventHubSale {
  "startDate": string;
  "endDate": string;
  "prices": LolEventHubItemCost[];
}
export interface LolEventHubSeasonPass {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "battleExpIconImage": string;
  "headerTitleImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "helpModalImage": string;
  "eventPassBundlesCatalogEntry": LolEventHubCatalogEntry[];
  "progressionPurchaseCatalogEntry": LolEventHubCatalogEntry;
  "rewardTrack": LolEventHubRewardTrack;
  "localizedUpsellTitle": string;
  "localizedUpsellTooltipTitle": string;
  "localizedUpsellTooltipDescription": string;
  "localizedUpsellButtonText": string;
  "upsellBackgroundImageUrl": string;
  "upsellTooltipBackgroundImageUrl": string;
  "objectiveBannerImage": string;
  "seasonPassSubType": string;
  "localizedSeasonLogo": string;
  "localizedShortName": string;
  "chapters": LolEventHubChapter[];
  "actBackgroundImage": string;
}
export type LolEventHubSeasonPassSubType = "Default" | "Mayhem";
export type LolEventHubSelectGrantStatusResponse = "FAILED" | "SELECTED";
export interface LolEventHubSelectionRequestDTO {
  "grantId": string;
  "rewardGroupId": string;
  "selections": string[];
}
export interface LolEventHubSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolEventHubSettingsResource {
  "data": LolEventHubPlayerSettingsDataMap;
  "schemaVersion": number;
}
export interface LolEventHubSimpleInventoryDTO {
  "items": Record<string, unknown>;
  "itemsJwt": string;
  "expires": string;
}
export interface LolEventHubSimpleInventoryResponseDTO {
  "data": LolEventHubSimpleInventoryDTO;
}
export interface LolEventHubSkinLineDescriptionDto {
  "title": string;
  "description": string;
  "iconImagePath": string;
}
export interface LolEventHubSkinLineDescriptionInfo {
  "title": string;
  "description": string;
  "iconPath": string;
}
export interface LolEventHubSkinLineInfo {
  "name": string;
  "descriptionInfo": LolEventHubSkinLineDescriptionInfo[];
  "splashPath": string;
  "tilePath": string;
  "collectionCardPath": string;
  "uncenteredSplashPath": string;
  "collectionDescription": string;
  "tiers": LolEventHubSkinLineTier[];
}
export interface LolEventHubSkinLineItemDto {
  "thumbnailImagePath": string;
  "largeImagePath"?: string;
  "localizedLongName": string;
  "localizedShortName": string;
  "largeVideoPath"?: string;
}
export interface LolEventHubSkinLineTier {
  "id": number;
  "name": string;
  "stage": number;
  "description"?: string;
  "splashPath": string;
  "uncenteredSplashPath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "shortName": string;
  "splashVideoPath"?: string;
  "collectionSplashVideoPath"?: string;
}
export interface LolEventHubSpotlightSkin {
  "championSkinID": number;
}
export interface LolEventHubSummonerIcon {
  "itemId": number;
}
export interface LolEventHubSvcRewardGrant {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "dateCreated": string;
  "status": LolEventHubGrantStatus;
  "grantElements": LolEventHubSvcRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
  "grantorDescription": LolEventHubGrantorDescription;
  "messageParameters": Record<string, unknown>;
}
export interface LolEventHubSvcRewardGrantElement {
  "elementId": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "status": LolEventHubRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolEventHubSvcRewardGroup {
  "id": string;
  "productId": string;
  "types": string[];
  "rewards": LolEventHubReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolEventHubRewardStrategy;
  "selectionStrategyConfig"?: LolEventHubSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
  "celebrationType": LolEventHubCelebrationType;
}
export interface LolEventHubTokenShop {
  "tokenImage": string;
  "tokenName": string;
  "tokenUuid": string;
  "offers": LolEventHubOffer[];
  "contentDrops": LolEventHubContentDrop[];
  "tokenBundlesCatalogEntry": LolEventHubCatalogEntry[];
}
export interface LolEventHubTokenShopUIData {
  "tokenName": string;
  "tokenImage": string;
  "tokenUuid": string;
  "offersVersion": number;
  "tokenBundlesCatalogEntry": LolEventHubCatalogEntry[];
}
export interface LolEventHubTokenUpsell {
  "id": string;
  "internalName": string;
  "title": string;
  "buttonText": string;
  "tooltipTitle": string;
  "tooltipDescription": string;
  "purchaseUrl": string;
  "tooltipBackgroundUrl": string;
  "backgroundUrl": string;
  "currencyUrl": string;
  "premiumCurrencyName": string;
  "dependentInventoryType": string;
  "dependentInventoryId": number;
  "currentlyLocked": LolEventHubTokenUpsellLockedType;
  "lockedCount": number;
  "startDate": string;
  "endDate": string;
}
export type LolEventHubTokenUpsellLockedType = "LOCKED" | "UNASSIGNED" | "UNLOCKED";
export interface LolEventHubTrackProgressNextReward {
  "currentXP": number;
  "nextLevelXP": number;
  "currentLevel": number;
  "nextReward": LolEventHubNextRewardUIData;
}
export interface LolEventHubTransaction {
  "transactionId": string;
  "itemKey": LolEventHubItemKey;
  "itemName": string;
  "iconUrl": string;
}
export interface LolEventHubTransactionResponseDTO {
  "id": string;
  "inventoryType": string;
  "itemId": number;
}
export interface LolEventHubTrigger {
  "type": string;
  "counterId": string;
  "entitlementItemId": string;
  "triggerValue": number;
}
export interface LolEventHubUnclaimedRewardsUIData {
  "rewardsCount": number;
  "lockedTokensCount": number;
  "timeOfLastUnclaimedReward": number;
}
export interface LolEventHubValidateOfferError {
  "errorKey": string;
  "meta": string;
}
export interface LolEventHubValidateOfferRequestV3 {
  "offerId": string;
}
export interface LolEventHubValidateOfferResponseV3 {
  "validationErrors": LolEventHubValidateOfferError[];
}
export interface LolEventHubValidationError {
  "errorCode": string;
  "message": string;
  "errorDetails": Record<string, string>;
  "responseItems": string[];
}
export interface LolEventHubValidationErrorEntry {
  "id": string;
}
export interface LolEventHubValidationRequest {
  "items": LolEventHubValidationRequestItem[];
  "ownedItems": LolEventHubItemOwnership[];
}
export interface LolEventHubValidationRequestItem {
  "itemKey": LolEventHubItemKey;
  "quantity": number;
}
export interface LolEventHubValidationResponse {
  "items": LolEventHubValidationResponseItem[];
  "valid": boolean;
}
export interface LolEventHubValidationResponseItem {
  "itemKey": LolEventHubItemKey;
  "quantity": number;
  "validationCurrencyInfo": LolEventHubItemPrice[];
  "sale"?: LolEventHubSale;
  "name"?: string;
  "description"?: string;
}
export interface LolEventHubWallet {
  "accountId": number;
  "balances": LolEventHubBalance[];
  "version": number;
}
export interface LolEventHubWalletCacheEntry {
  "signedBalancesJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolEventHubWalletDTO {
  "puuid": string;
  "accountId": number;
  "expires": string;
  "balances": Record<string, number>;
  "balancesJwt": string;
}
export interface LolEventHubWalletResponseDTO {
  "data": LolEventHubWalletDTO;
}
export interface LolEventHubWalletUpdateNotification {
  "receivedAtMs": number;
  "amount": number;
  "currencyType": string;
}
export interface LolEventHubXboxSubscriptionStatus {
  "active": string;
  "subscriptionId": string;
}
export interface LolFeaturedModesAccountIdAndSummonerId {
  "summonerId": number;
}
export interface LolFeaturedModesCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
}
export interface LolFeaturedModesCollectionsSummonerIcon {
  "iconId": number;
  "ownership": LolFeaturedModesCollectionsOwnership;
}
export interface LolFeaturedModesEligibility {
  "queueId": number;
  "eligible": boolean;
  "restrictions": LolFeaturedModesEligibilityRestriction[];
}
export interface LolFeaturedModesEligibilityRestriction {
  "restrictionCode": LolFeaturedModesEligibilityRestrictionCode;
  "restrictionArgs": Record<string, string>;
  "expiredTimestamp": number;
  "summonerIds": number[];
}
export type LolFeaturedModesEligibilityRestrictionCode = "GameVersionMismatch" | "GameVersionMissing" | "GameVersionNotSupported" | "PlayerAvailableChampionRestriction" | "PlayerBannedRestriction" | "PlayerBingeRestriction" | "PlayerDodgeRestriction" | "PlayerInGameRestriction" | "PlayerLeaverBustedRestriction" | "PlayerLeaverQueueLockoutRestriction" | "PlayerLeaverTaintedWarningRestriction" | "PlayerLevelRestriction" | "PlayerMaxLevelRestriction" | "PlayerMinLevelRestriction" | "PlayerMinorRestriction" | "PlayerRankedSuspensionRestriction" | "PlayerTimedRestriction" | "PrerequisiteQueuesNotPlayedRestriction" | "QueueDisabled" | "QueueUnsupported" | "TeamDivisionRestriction" | "TeamHighMMRMaxSizeRestriction" | "TeamMaxSizeRestriction" | "TeamMinSizeRestriction" | "TeamSizeRestriction" | "TeamSkillRestriction" | "UnknownRestriction";
export interface LolFeaturedModesFeaturedModesConfig {
  "NotificationsEnabled": boolean;
  "QueueToggleNotificationMinutesThreshold": number;
  "MaxNotificationSaveDelayMinutes": number;
}
export interface LolFeaturedModesGameflowAvailability {
  "isAvailable": boolean;
  "state": LolFeaturedModesGameflowAvailabilityState;
}
export type LolFeaturedModesGameflowAvailabilityState = "Available" | "Configuration" | "EligibilityInfoMissing" | "InGameFlow" | "Initializing" | "Patching" | "PlayerBanned";
export type LolFeaturedModesGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolFeaturedModesGameflowSession {
  "phase": LolFeaturedModesGameflowPhase;
}
export interface LolFeaturedModesLoginSession {
  "state": LolFeaturedModesLoginSessionStates;
  "summonerId": number;
}
export type LolFeaturedModesLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolFeaturedModesMaps {
  "gameModeName": string;
  "isRGM": boolean;
  "assets": Record<string, string>;
}
export interface LolFeaturedModesPlayerNotificationResource {
  "backgroundUrl": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolFeaturedModesQueue {
  "id": number;
  "mapId": number;
  "name": string;
  "gameMode": string;
  "category": LolFeaturedModesQueueGameCategory;
  "lastToggledOffTime": number;
  "lastToggledOnTime": number;
  "queueAvailability": LolFeaturedModesQueueAvailability;
}
export type LolFeaturedModesQueueAvailability = "Available" | "DoesntMeetRequirements" | "PlatformDisabled";
export type LolFeaturedModesQueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface LolGameClientChatBuddy {
  "gameName": string;
  "tagLine": string;
  "puuid": string;
  "summonerId": number;
}
export interface LolGameClientChatConversationMessageResource {
  "type": string;
  "fromSummonerId": number;
  "fromPuuid": string;
  "fromId": string;
  "body": string;
  "timestamp": string;
}
export interface LolGameClientChatConversationResource {
  "id": string;
  "type": string;
  "name": string;
  "gameName": string;
  "gameTag": string;
}
export interface LolGameClientChatFriendResource {
  "summonerId": number;
  "id": string;
  "puuid": string;
  "gameName": string;
  "gameTag": string;
  "name": string;
}
export interface LolGameClientChatGameClientChatMessageResource {
  "fromSummonerName": string;
  "body": string;
}
export interface LolGameClientChatMessageToPlayer {
  "gameName": string;
  "tagLine": string;
  "body": string;
}
export interface LolGameClientChatMutedPlayerInfo {
  "puuid": string;
  "summonerId": number;
  "obfuscatedPuuid": string;
  "obfuscatedSummonerId": number;
}
export interface LolGameClientChatParentalControlsStatus {
  "enabled": boolean;
  "isTextChatRestricted": boolean;
  "isVoiceChatRestricted": boolean;
  "isFriendingRestricted": boolean;
}
export interface LolGameDataInventoryLolInventoryType {
  "inventoryTypeId": string;
  "capInventoryTypeId": string;
  "gipAware": boolean;
  "gipJsonPath": string;
  "gipIsMap": boolean;
  "gipItemId": string;
  "gipName": string;
  "gipDescription": string;
  "gipImage": string;
}
export interface LolGameQueuesLoginSession {
  "state": LolGameQueuesLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "connected": boolean;
}
export type LolGameQueuesLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolGameQueuesOperationalQueueConfig {
  "queueId": number;
  "isEnabled": boolean;
  "mutators": string;
  "isVisibleInClient": boolean;
  "isSpectatable": boolean;
}
export interface LolGameQueuesOperationalSpectatorConfig {
  "isEnabled": boolean;
  "isUsingOperationalConfig": boolean;
}
export interface LolGameQueuesPlatformConfigEnabledMap {
  "gameMapId": number;
  "minPlayers": number;
}
export interface LolGameQueuesQueue {
  "id": number;
  "mapId": number;
  "name": string;
  "shortName": string;
  "description": string;
  "detailedDescription": string;
  "type": string;
  "gameMode": string;
  "assetMutator": string;
  "maxTierForPremadeSize2": string;
  "maxDivisionForPremadeSize2": string;
  "category": LolGameQueuesQueueGameCategory;
  "gameTypeConfig": LolGameQueuesQueueGameTypeConfig;
  "numPlayersPerTeam": number;
  "minimumParticipantListSize": number;
  "maximumParticipantListSize": number;
  "minLevel": number;
  "isRanked": boolean;
  "areFreeChampionsAllowed": boolean;
  "isTeamBuilderManaged": boolean;
  "queueAvailability": LolGameQueuesQueueAvailability;
  "isEnabled": boolean;
  "isVisible": boolean;
  "queueRewards": LolGameQueuesQueueReward;
  "spectatorEnabled": boolean;
  "championsRequiredToPlay": number;
  "allowablePremadeSizes": number[];
  "showPositionSelector": boolean;
  "showQuickPlaySlotSelection": boolean;
  "lastToggledOffTime": number;
  "lastToggledOnTime": number;
  "removalFromGameAllowed": boolean;
  "removalFromGameDelayMinutes": number;
  "hidePlayerPosition": boolean;
  "gameSelectModeGroup": string;
  "gameSelectCategory": string;
  "gameSelectPriority": number;
  "isLimitedTimeQueue": boolean;
  "isSkillTreeQueue": boolean;
  "isBotHonoringAllowed": boolean;
  "isCustom": boolean;
  "numberOfTeamsInLobby": number;
  "maxLobbySpectatorCount": number;
  "pickMode": string;
  "teamVoiceEnabled": boolean;
}
export type LolGameQueuesQueueAvailability = "Available" | "DoesntMeetRequirements" | "PlatformDisabled";
export interface LolGameQueuesQueueCustomGame {
  "subcategories": LolGameQueuesQueueCustomGameSubcategory[];
  "queueAvailability": LolGameQueuesQueueAvailability;
  "spectatorPolicies": LolGameQueuesQueueCustomGameSpectatorPolicy[];
  "spectatorSlotLimit": number;
  "gameServerRegions"?: string[];
}
export type LolGameQueuesQueueCustomGameSpectatorPolicy = "AllAllowed" | "FriendsAllowed" | "LobbyAllowed" | "NotAllowed";
export interface LolGameQueuesQueueCustomGameSubcategory {
  "mapId": number;
  "gameMode": string;
  "mutators": LolGameQueuesQueueGameTypeConfig[];
  "numPlayersPerTeam": number;
  "minimumParticipantListSize": number;
  "maximumParticipantListSize": number;
  "maxPlayerCount": number;
  "minLevel": number;
  "queueAvailability": LolGameQueuesQueueAvailability;
  "customSpectatorPolicies": LolGameQueuesQueueCustomGameSpectatorPolicy[];
}
export type LolGameQueuesQueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface LolGameQueuesQueueGameTypeConfig {
  "id": number;
  "name": string;
  "maxAllowableBans": number;
  "allowTrades": boolean;
  "exclusivePick": boolean;
  "duplicatePick": boolean;
  "teamChampionPool": boolean;
  "crossTeamChampionPool": boolean;
  "advancedLearningQuests": boolean;
  "battleBoost": boolean;
  "deathMatch": boolean;
  "doNotRemove": boolean;
  "learningQuests": boolean;
  "onboardCoopBeginner": boolean;
  "reroll": boolean;
  "mainPickTimerDuration": number;
  "postPickTimerDuration": number;
  "banTimerDuration": number;
  "pickMode": string;
  "banMode": string;
  "gameModeOverride"?: string;
  "numPlayersPerTeamOverride"?: number;
}
export interface LolGameQueuesQueueReward {
  "isIpEnabled": boolean;
  "isXpEnabled": boolean;
  "isChampionPointsEnabled": boolean;
  "partySizeIpRewards": number[];
}
export interface LolGameQueuesQueueTranslation {
  "id": number;
  "name": string;
  "shortName": string;
  "description": string;
  "detailedDescription": string;
  "gameSelectModeGroup": string;
  "gameSelectCategory": string;
  "gameSelectPriority": number;
  "isLimitedTimeQueue": boolean;
  "isSkillTreeQueue": boolean;
  "isBotHonoringAllowed": boolean;
  "hidePlayerPosition": boolean;
  "viableChampionRoster": number[];
  "pickMode": string;
}
export interface LolGameSettingsLoginSession {
  "state": LolGameSettingsLoginSessionStates;
  "summonerId": number;
  "accountId": number;
}
export type LolGameSettingsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolGameSettingsgamesettingsgameclient {
  "running": boolean;
}
export interface LolGameSettingsgamesettingsgameflowsession {
  "gameClient": LolGameSettingsgamesettingsgameclient;
}
export interface LolGameflowCrashReportingSettings {
  "type": string;
  "enabled": boolean;
}
export interface LolGameflowGameModeSpellList {
  "spells": number[];
}
export interface LolGameflowGameStateUpdate {
  "id": number;
  "gameState": string;
  "gameType": string;
  "errorMessage": string;
  "playerCredentials"?: GameflowLcdsPlayerCredentialsDto;
}
export interface LolGameflowGameflowAvailability {
  "isAvailable": boolean;
  "state": LolGameflowGameflowAvailabilityState;
}
export type LolGameflowGameflowAvailabilityState = "Available" | "Configuration" | "EligibilityInfoMissing" | "InGameFlow" | "Initializing" | "Patching" | "PlayerBanned";
export interface LolGameflowGameflowGameClient {
  "serverIp": string;
  "serverPort": number;
  "observerServerIp": string;
  "observerServerPort": number;
  "running": boolean;
  "visible": boolean;
}
export interface LolGameflowGameflowGameData {
  "gameId": number;
  "queue": LolGameflowQueue;
  "isCustomGame": boolean;
  "gameName": string;
  "password": string;
  "teamOne": unknown[];
  "teamTwo": unknown[];
  "playerChampionSelections": unknown[];
  "spectatorsAllowed": boolean;
  "spectatorKey": string;
}
export interface LolGameflowGameflowGameDodge {
  "state": LolGameflowGameflowGameDodgeState;
  "dodgeIds": number[];
  "phase": LolGameflowGameflowPhase;
}
export type LolGameflowGameflowGameDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
export interface LolGameflowGameflowGameMap {
  "id": number;
  "name": string;
  "mapStringId": string;
  "gameMode": string;
  "gameModeName": string;
  "gameModeShortName": string;
  "gameMutator": string;
  "isRGM": boolean;
  "description": string;
  "platformId": string;
  "platformName": string;
  "assets": unknown;
  "categorizedContentBundles": unknown;
  "properties": unknown;
  "perPositionRequiredSummonerSpells": Record<string, LolGameflowGameModeSpellList>;
  "perPositionDisallowedSummonerSpells": Record<string, LolGameflowGameModeSpellList>;
}
export type LolGameflowGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolGameflowGameflowProcessInfo {
  "pid": number;
  "rawArgs": string[];
  "standalone": boolean;
}
export interface LolGameflowGameflowSession {
  "phase": LolGameflowGameflowPhase;
  "gameData": LolGameflowGameflowGameData;
  "gameClient": LolGameflowGameflowGameClient;
  "map": LolGameflowGameflowGameMap;
  "gameDodge": LolGameflowGameflowGameDodge;
}
export type LolGameflowGameflowWatchPhase = "None" | "WatchFailedToLaunch" | "WatchInProgress" | "WatchStarted";
export interface LolGameflowInstallPaths {
  "gameInstallRoot": string;
  "gameExecutablePath": string;
  "tftInstallRoot": string;
}
export interface LolGameflowLobbyStatus {
  "queueId": number;
  "isCustom": boolean;
  "isPracticeTool": boolean;
  "isLeader": boolean;
  "isSpectator": boolean;
  "allowedPlayAgain": boolean;
  "isNoSpectateDelay": boolean;
  "memberSummonerIds": number[];
  "invitedSummonerIds": number[];
  "lobbyId"?: string;
  "customSpectatorPolicy": LolGameflowQueueCustomGameSpectatorPolicy;
}
export interface LolGameflowLoginSession {
  "state": LolGameflowLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "connected": boolean;
}
export type LolGameflowLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolGameflowPatcherProductState {
  "isCorrupted": boolean;
  "isStopped": boolean;
  "isUpToDate": boolean;
  "isUpdateAvailable": boolean;
  "action": LolGameflowPatcherProductStateAction;
}
export type LolGameflowPatcherProductStateAction = "CheckingForUpdates" | "Idle" | "Migrating" | "Patching" | "Repairing";
export interface LolGameflowPlayerCredentials {
  "tvJwt": string;
}
export interface LolGameflowPlayerStatus {
  "currentLobbyStatus"?: LolGameflowLobbyStatus;
  "lastQueuedLobbyStatus"?: LolGameflowLobbyStatus;
  "canInviteOthersAtEog": boolean;
}
export interface LolGameflowQueue {
  "id": number;
  "mapId": number;
  "name": string;
  "shortName": string;
  "description": string;
  "detailedDescription": string;
  "type": string;
  "gameMode": string;
  "assetMutator": string;
  "category": LolGameflowQueueGameCategory;
  "gameTypeConfig": LolGameflowQueueGameTypeConfig;
  "numPlayersPerTeam": number;
  "minimumParticipantListSize": number;
  "maximumParticipantListSize": number;
  "minLevel": number;
  "isRanked": boolean;
  "areFreeChampionsAllowed": boolean;
  "isTeamBuilderManaged": boolean;
  "queueAvailability": LolGameflowQueueAvailability;
  "queueRewards": LolGameflowQueueReward;
  "spectatorEnabled": boolean;
  "championsRequiredToPlay": number;
  "allowablePremadeSizes": number[];
  "showPositionSelector": boolean;
  "lastToggledOffTime": number;
  "lastToggledOnTime": number;
  "removalFromGameAllowed": boolean;
  "removalFromGameDelayMinutes": number;
  "isCustom": boolean;
  "isBotHonoringAllowed": boolean;
  "pickMode": string;
}
export type LolGameflowQueueAvailability = "Available" | "DoesntMeetRequirements" | "PlatformDisabled";
export type LolGameflowQueueCustomGameSpectatorPolicy = "AllAllowed" | "FriendsAllowed" | "LobbyAllowed" | "NotAllowed";
export type LolGameflowQueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface LolGameflowQueueGameTypeConfig {
  "id": number;
  "name": string;
  "maxAllowableBans": number;
  "allowTrades": boolean;
  "exclusivePick": boolean;
  "duplicatePick": boolean;
  "teamChampionPool": boolean;
  "crossTeamChampionPool": boolean;
  "advancedLearningQuests": boolean;
  "battleBoost": boolean;
  "deathMatch": boolean;
  "doNotRemove": boolean;
  "learningQuests": boolean;
  "onboardCoopBeginner": boolean;
  "reroll": boolean;
  "mainPickTimerDuration": number;
  "postPickTimerDuration": number;
  "banTimerDuration": number;
  "pickMode": string;
  "banMode": string;
}
export interface LolGameflowQueueReward {
  "isIpEnabled": boolean;
  "isXpEnabled": boolean;
  "isChampionPointsEnabled": boolean;
  "partySizeIpRewards": number[];
}
export interface LolGameflowRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolGameflowRegistrationStatus {
  "complete": boolean;
  "errorCodes": string[];
}
export interface LolGameflowReplaysSettingsData {
  "highlights-folder-path": string;
}
export interface LolGameflowReplaysSettingsResource {
  "data": LolGameflowReplaysSettingsData;
}
export interface LolGameflowSpectateGameInfoResource {
  "dropInSpectateGameId": string;
  "gameQueueType": string;
  "allowObserveMode": string;
  "puuid": string;
  "spectatorKey": string;
}
export interface LolHeartbeatLcdsConnection {
  "stableConnection": boolean;
}
export interface LolHeartbeatLoginSession {
  "state": LolHeartbeatLoginSessionStates;
  "summonerId": number;
  "accountId": number;
}
export type LolHeartbeatLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolHighlightsHighlight {
  "id": number;
  "name": string;
  "filepath": string;
  "url": string;
  "mtimeMsUtc": number;
  "mtimeIso8601": string;
  "fileSizeBytes": number;
}
export interface LolHighlightsHighlightsConfig {
  "isHighlightsEnabled": boolean;
  "invalidHighlightNameCharacters": string;
}
export interface LolHighlightsHighlightsDynamicConfig {
  "Enabled": boolean;
}
export interface LolHighlightsHighlightsSettingsData {
  "highlights-folder-path": string;
}
export interface LolHighlightsHighlightsSettingsResource {
  "data": LolHighlightsHighlightsSettingsData;
}
export interface LolHonorV2AccountIdAndSummonerId {
  "accountId": number;
  "summonerId": number;
}
export interface LolHonorV2ApiHonorPlayerServerRequest {
  "summonerId": number;
  "puuid": string;
  "honorType": string;
  "gameId": number;
}
export interface LolHonorV2ApiHonorPlayerServerRequestV3 {
  "recipientPuuid": string;
  "honorType": string;
}
export interface LolHonorV2ApiSubmitBallotRequest {
  "honorRequests": LolHonorV2ApiHonorPlayerServerRequestV3[];
}
export interface LolHonorV2Ballot {
  "eligibleAllies": LolHonorV2EligiblePlayer[];
  "eligibleOpponents": LolHonorV2EligiblePlayer[];
  "votePool": LolHonorV2VotePool;
  "gameId": number;
  "honoredPlayers": LolHonorV2ApiHonorPlayerServerRequestV3[];
}
export interface LolHonorV2DynamicHonorMessage {
  "messageId": string;
  "value": number;
}
export interface LolHonorV2EligiblePlayer {
  "puuid": string;
  "summonerId": number;
  "summonerName": string;
  "championName": string;
  "championId": number;
  "skinSplashPath": string;
  "role": string;
  "botPlayer": boolean;
}
export interface LolHonorV2EndOfGamePlayer {
  "puuid": string;
  "botPlayer": boolean;
  "gameId": number;
  "leaver": boolean;
  "severeTransgressor": boolean;
  "summonerName": string;
  "summonerId": number;
  "skinSplashPath": string;
  "championName": string;
  "championId": number;
  "detectedTeamPosition": string;
}
export interface LolHonorV2EndOfGameStats {
  "gameId": number;
  "gameType": string;
  "gameMutators": string[];
  "invalid": boolean;
  "queueType": string;
  "ranked": boolean;
  "reportGameId": number;
  "teams": LolHonorV2EndOfGameTeam[];
  "localPlayer": LolHonorV2EndOfGamePlayer;
  "gameEndedInEarlySurrender": boolean;
}
export interface LolHonorV2EndOfGameTeam {
  "players": LolHonorV2EndOfGamePlayer[];
  "isPlayerTeam": boolean;
}
export interface LolHonorV2GameflowGameData {
  "gameId": number;
  "queue": LolHonorV2Queue;
}
export type LolHonorV2GameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolHonorV2GameflowSession {
  "phase": LolHonorV2GameflowPhase;
  "gameData": LolHonorV2GameflowGameData;
}
export interface LolHonorV2Honor {
  "honorCategory": string;
  "voterRelationship": string;
  "senderPuuid": string;
}
export interface LolHonorV2HonorConfig {
  "Enabled": boolean;
  "SecondsToVote": number;
  "HonorVisibilityEnabled": boolean;
  "HonorSuggestionsEnabled": boolean;
  "honorEndpointsV2Enabled": boolean;
  "ceremonyV3Enabled": boolean;
  "useHonorInPostgamePlugin": boolean;
}
export interface LolHonorV2HonorInteraction {
  "puuid": string;
  "displayName": string;
  "gameId": number;
  "summonerId": number;
}
export interface LolHonorV2HonorRecipient {
  "puuid": string;
  "gameId": number;
  "honors": LolHonorV2Honor[];
}
export interface LolHonorV2HonorSummoner {
  "puuid": string;
  "displayName": string;
  "summonerId": number;
}
export interface LolHonorV2HonorView {
  "honorLevel": number;
  "redemptions": LolHonorV2Redemption[];
}
export interface LolHonorV2LoginSession {
  "state": LolHonorV2LoginSessionStates;
}
export type LolHonorV2LoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolHonorV2Mail {
  "mailId": string;
  "message": string;
  "state": string;
  "createdAt": number;
}
export interface LolHonorV2MutualHonor {
  "gameId": number;
  "summoners": LolHonorV2MutualHonorPlayer[];
}
export interface LolHonorV2MutualHonorPlayer {
  "summonerId": number;
  "championId": number;
  "skinId": number;
}
export interface LolHonorV2ProfileInfo {
  "honorLevel": number;
  "checkpoint": number;
  "rewardsLocked": boolean;
  "redemptions": LolHonorV2Redemption[];
}
export interface LolHonorV2Queue {
  "id": number;
  "mapId": number;
  "type": string;
  "gameMode": string;
  "removalFromGameAllowed": boolean;
  "removalFromGameDelayMinutes": number;
  "isBotHonoringAllowed": boolean;
}
export interface LolHonorV2Redemption {
  "required": number;
  "remaining": number;
  "eventType": string;
}
export interface LolHonorV2RetrieveProfileResponse {
  "honorLevel": number;
  "checkpoint": number;
  "rewardsLocked": boolean;
  "redemptions": LolHonorV2Redemption[];
}
export interface LolHonorV2Reward {
  "rewardType": string;
  "quantity": number;
}
export interface LolHonorV2SequenceEvent {
  "name": string;
  "priority": number;
}
export interface LolHonorV2SimpleDialogMessage {
  "accountId": number;
  "msgId": string;
  "type": string;
  "params": string[];
}
export interface LolHonorV2VendedHonorChange {
  "actionType": string;
  "previousState": LolHonorV2VendedHonorState;
  "currentState": LolHonorV2VendedHonorState;
  "reward": LolHonorV2Reward;
  "dynamicHonorMessage": LolHonorV2DynamicHonorMessage;
}
export interface LolHonorV2VendedHonorState {
  "level": number;
  "checkpoint": number;
  "rewardsLocked": boolean;
}
export interface LolHonorV2VendedReward {
  "rewardType": string;
  "quantity": number;
  "dynamicHonorMessage": LolHonorV2DynamicHonorMessage;
}
export interface LolHonorV2VoteCompletion {
  "gameId": number;
  "fullTeamVote": boolean;
}
export interface LolHonorV2VotePool {
  "votes": number;
  "fromGamePlayed": number;
  "fromHighHonor": number;
  "fromRecentHonors": number;
  "fromRollover": number;
}
export interface LolHovercardAlias {
  "gameName": string;
  "tagLine": string;
}
export interface LolHovercardChatSession {
  "sessionState": string;
}
export interface LolHovercardContentCookies {
  "content_id": string;
  "content_path": string;
  "cookies": LolHovercardcookie[];
}
export interface LolHovercardFriendResult {
  "id": string;
  "puuid": string;
  "summonerId": number;
  "name": string;
  "accountId": number;
  "icon": number;
  "gameName": string;
  "gameTag": string;
  "availability": string;
  "note": string;
  "score": number;
  "patchline": string;
  "platformId": string;
  "product": string;
  "productName": string;
  "statusMessage": string;
  "lol": Record<string, string>;
  "discordOnlineStatus"?: string;
  "discordId"?: string;
  "relationshipOnRiot": string;
}
export interface LolHovercardHovercardUserInfo {
  "id": string;
  "puuid": string;
  "summonerId": number;
  "name": string;
  "accountId": number;
  "icon": number;
  "gameName": string;
  "gameTag": string;
  "availability": string;
  "note": string;
  "masteryScore": number;
  "legendaryMasteryScore": number;
  "patchline": string;
  "platformId": string;
  "product": string;
  "productName": string;
  "statusMessage": string;
  "summonerIcon": number;
  "summonerLevel": number;
  "remoteProduct": boolean;
  "remotePlatform": boolean;
  "remoteProductIconUrl": string;
  "remoteProductBackdropUrl": string;
  "partySummoners": string[];
  "lol": Record<string, string>;
  "discordOnlineStatus"?: string;
  "discordId"?: string;
  "relationshipOnRiot": string;
}
export interface LolHovercardPartyInfo {
  "isPartyOpen": boolean;
  "summoners"?: number[];
  "summonerPuuids"?: string[];
}
export interface LolHovercardPatchlineMetadata {
  "product_id": string;
  "id": string;
  "content_paths": Record<string, string>;
  "content_cookies": LolHovercardContentCookies[];
}
export interface LolHovercardProductMetadata {
  "id": string;
  "name": string;
  "patchlines": Record<string, LolHovercardPatchlineMetadata>;
}
export interface LolHovercardProductMetadataMap {
  "products": Record<string, LolHovercardProductMetadata>;
}
export interface LolHovercardSummoner {
  "summonerId": number;
  "displayName": string;
  "accountId": number;
  "summonerLevel": number;
  "puuid": string;
  "gameName": string;
  "tagLine": string;
}
export interface LolHovercardSummonerIdAndIcon {
  "profileIconId": number;
}
export interface LolHovercardSummonerIdAndName {
  "summonerId": number;
  "displayName": string;
  "puuid": string;
}
export interface LolHovercardTopChampionMastery {
  "score": number;
}
export interface LolHovercardcookie {
  "name": string;
  "value": string;
}
export interface LolInventoryAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolInventoryCatalogItem {
  "itemId": number;
  "inventoryType": string;
  "itemInstanceId"?: string;
}
export interface LolInventoryClientCacheClearMessageDTO {
  "regions": string[];
  "clearAll": boolean;
  "inventoryTypes": string[];
}
export interface LolInventoryCurrencyDTO {
  "amount": number;
  "subCurrencies": Record<string, number>;
}
export interface LolInventoryEndOfGameXp {
  "PER_WIN": number;
}
export interface LolInventoryEndOfGameXpNotification {
  "xp": LolInventoryEndOfGameXp;
}
export interface LolInventoryInventoryCacheEntry {
  "signedInventoryJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolInventoryInventoryDTO {
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "items": Record<string, unknown>;
  "expires": string;
  "itemsJwt": string;
}
export interface LolInventoryInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolInventoryItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "wins": number;
}
export interface LolInventoryInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "ownedQuantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "payload": unknown;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "lsb": boolean;
  "wins": number;
}
export interface LolInventoryInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolInventoryItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "owned": boolean;
  "wins": number;
  "payload": unknown;
}
export interface LolInventoryInventoryNotification {
  "id": number;
  "itemId": number;
  "inventoryType": string;
  "type": string;
  "acknowledged": boolean;
}
export interface LolInventoryInventoryResponseDTO {
  "data": LolInventoryInventoryDTO;
}
export interface LolInventoryItemKey {
  "inventoryType": string;
  "itemId": number;
}
export type LolInventoryItemOwnershipType = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolInventoryLoginSession {
  "state": LolInventoryLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
  "puuid": string;
}
export type LolInventoryLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolInventoryLolInventoryType {
  "inventoryTypeId": string;
  "capInventoryTypeId": string;
}
export interface LolInventoryLoyaltyRewards {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": Record<string, number>;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export interface LolInventoryLoyaltyRewardsSimplified {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": number;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export type LolInventoryLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolInventoryLoyaltyStatusNotification {
  "status": LolInventoryLoyaltyStatus;
  "rewards": LolInventoryLoyaltyRewardsSimplified;
  "reloadInventory": boolean;
}
export interface LolInventoryPlayerNotification {
  "critical": boolean;
  "detailKey": string;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
  "iconUrl": string;
}
export interface LolInventoryRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolInventoryRmsEntitlementPayload {
  "itemId": string;
  "itemTypeId": string;
  "tiers": string;
  "entitlementTypeId": string;
  "resourceOperation": string;
}
export interface LolInventoryRmsStoreEntitlementItem {
  "inventoryType": string;
  "itemId": string;
}
export interface LolInventoryRmsStoreEntitlementPayload {
  "transactionId": string;
  "items": LolInventoryRmsStoreEntitlementItem[];
}
export interface LolInventoryRmsWalletPayload {
}
export interface LolInventoryRmsXboxSubscriptionChange {
  "puuid": string;
  "subscriptionId": string;
  "active": string;
  "identityProvider": string[];
}
export interface LolInventorySimpleInventoryDTO {
  "items": Record<string, unknown>;
  "itemsJwt": string;
  "expires": string;
}
export interface LolInventorySimpleInventoryResponseDTO {
  "data": LolInventorySimpleInventoryDTO;
}
export interface LolInventorySummonerIcon {
  "itemId": number;
}
export interface LolInventoryWallet {
  "ip": number;
  "rp": number;
}
export interface LolInventoryWalletCacheEntry {
  "signedBalancesJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolInventoryWalletDTO {
  "puuid": string;
  "accountId": number;
  "expires": string;
  "balances": Record<string, number>;
  "balancesJwt": string;
}
export interface LolInventoryWalletResponseDTO {
  "data": LolInventoryWalletDTO;
}
export interface LolInventoryWalletUpdateNotification {
  "receivedAtMs": number;
  "amount": number;
  "currencyType": string;
}
export interface LolInventoryXboxSubscriptionStatus {
  "active": string;
  "subscriptionId": string;
}
export interface LolItemSetsGameDataChampion {
  "alias": string;
}
export interface LolItemSetsGameDataSummaryChampion {
  "id": number;
}
export interface LolItemSetsItemSet {
  "uid": string;
  "title": string;
  "mode": string;
  "map": string;
  "type": string;
  "sortrank": number;
  "startedFrom": string;
  "associatedChampions": number[];
  "associatedMaps": number[];
  "blocks": LolItemSetsItemSetBlock[];
  "preferredItemSlots": LolItemSetsPreferredItemSlot[];
}
export interface LolItemSetsItemSetBlock {
  "type": string;
  "hideIfSummonerSpell": string;
  "showIfSummonerSpell": string;
  "items": LolItemSetsItemSetItem[];
}
export interface LolItemSetsItemSetItem {
  "id": string;
  "count": number;
}
export interface LolItemSetsItemSets {
  "timestamp": number;
  "accountId": number;
  "itemSets": LolItemSetsItemSet[];
}
export interface LolItemSetsLoginSession {
  "state": LolItemSetsLoginSessionStates;
  "summonerId": number;
  "accountId": number;
}
export type LolItemSetsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolItemSetsNamecheckAuthorization {
  "subject": string;
}
export interface LolItemSetsNamecheckLoginDataPacket {
  "platformId": string;
}
export interface LolItemSetsNamecheckPayload {
  "name": string;
  "nameValidationContext": string;
  "puuid": string;
  "shard": string;
}
export interface LolItemSetsNamecheckResponse {
  "errors": string[];
}
export interface LolItemSetsPreferredItemSlot {
  "id": string;
  "preferredItemSlot": number;
}
export interface LolItemSetsValidateItemSetNameInput {
  "name": string;
}
export interface LolItemSetsValidateItemSetNameResponse {
  "success": boolean;
  "nameCheckResponse": LolItemSetsNamecheckResponse;
}
export interface LolKickoutKickoutMessage {
  "message": string;
}
export interface LolKrShutdownLawAllQueueShutdownStatus {
  "isAllQueuesDisabled": boolean;
}
export interface LolKrShutdownLawAntiAddictionState {
  "policyType": LolKrShutdownLawPolicyType;
}
export type LolKrShutdownLawPolicyType = "disableMatchMaking" | "playTime" | "shutdown" | "warningMessage";
export interface LolKrShutdownLawQueueShutdownStatus {
  "isDisabled": boolean;
}
export interface LolKrShutdownLawRatingScreenInfo {
  "shown": boolean;
}
export interface LolKrShutdownLawShutdownLawNotification {
  "type": LolKrShutdownLawShutdownLawStatus;
}
export type LolKrShutdownLawShutdownLawStatus = "CUT_OFF" | "NONE" | "WARNING";
export interface LolL10nRegionLocale {
  "region": string;
  "locale": string;
  "webRegion": string;
  "webLanguage": string;
}
export interface LolLeaderboardLeaderboardConfiguration {
  "name": string;
  "groupings": string[];
  "pageSize": number;
  "refreshTimeMs": number;
  "season": string;
}
export interface LolLeaderboardLeaderboardPageResponse {
  "grouping": string;
  "season": string;
  "region": string;
  "name": string;
  "startRank": number;
  "endRank": number;
  "size": number;
  "rankings": LolLeaderboardPagedLeaderboardEntry[];
}
export interface LolLeaderboardLeaderboardPlayerRanking {
  "entityId": string;
  "ranking": number;
}
export interface LolLeaderboardLoginSession {
  "state": LolLeaderboardLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
}
export type LolLeaderboardLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolLeaderboardPagedLeaderboardEntry {
  "entityId": string;
  "entityName": string;
  "ranking": number;
  "score": number;
  "anonymous": boolean;
}
export interface LolLeagueSessionAntiAddictionTokenEnvelope {
  "antiAddictionToken": string;
}
export interface LolLeagueSessionLeagueSessionRMSNotification {
  "product": string;
  "puuid": string;
  "sessionId": string;
  "state": string;
  "sessionInitiatedAt": number;
}
export type LolLeagueSessionLeagueSessionStatus = "ANTI_ADDICTION_EXPIRED" | "DUPLICATED" | "EXPIRED" | "INITIALIZED" | "UNINITIALIZED";
export interface LolLeagueSessionLeagueSessionTokenEnvelope {
  "token"?: string;
}
export interface LolLeaverBusterLeaverBusterEntryDto {
  "puuid": string;
  "tainted": boolean;
  "preLockoutAckNeeded": boolean;
  "onLockoutAckNeeded": boolean;
  "leaverScore": number;
  "leaverLevel": number;
  "warnSentMillis": number;
  "warnAckedMillis": number;
  "leaverPenalty": LolLeaverBusterLeaverBusterPenaltyResponse;
}
export interface LolLeaverBusterLeaverBusterNotificationResource {
  "id": number;
  "msgId": string;
  "accountId": number;
  "type": LolLeaverBusterLeaverBusterNotificationType;
  "punishedGamesRemaining": number;
  "queueLockoutTimerExpiryUtcMillisDiff": number;
  "fromRms": boolean;
}
export type LolLeaverBusterLeaverBusterNotificationType = "Invalid" | "OnLockoutWarning" | "PreLockoutWarning" | "PunishedGamesRemaining" | "PunishmentIncurred" | "RankedRestrictedGames" | "Reforming" | "TaintedWarning" | "WinBasedRankedRestrictionsEnabled";
export interface LolLeaverBusterLeaverBusterPenaltyResponse {
  "puuid": string;
  "hasActivePenalty": boolean;
  "punishmentTimerType": LolLeaverBusterLeaverPenaltyType;
  "queueLockoutTimerExpiryUtcMillis": number;
}
export type LolLeaverBusterLeaverPenaltyType = "NO_PENALTY" | "QUEUE_DELAY_TIMER" | "QUEUE_LOCKOUT_TIMER";
export interface LolLeaverBusterMatchmakingSearchErrorResource {
  "id": number;
  "errorType": string;
  "penalizedSummonerId": number;
  "penaltyTimeRemaining": number;
  "message": string;
}
export interface LolLeaverBusterMatchmakingSearchResource {
  "queueId": number;
  "errors": LolLeaverBusterMatchmakingSearchErrorResource[];
}
export interface LolLeaverBusterPlayerNotificationResource {
  "backgroundUrl": string;
  "created": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolLeaverBusterRankedRestriction {
  "punishedGamesRemaining": number;
}
export interface LolLeaverBusterRankedRestrictionEntryDto {
  "puuid": string;
  "restrictedGamesRemaining": number;
  "restrictedGamesOriginal": number;
  "rankedRestrictionAckNeeded": boolean;
}
export interface LolLeaverBusterRankedRestrictionGamesUpdate {
  "punishedGamesRemaining": number;
}
export interface LolLeaverBusterRankedRestrictionInfo {
  "punishedGamesRemaining": number;
  "needsAck": boolean;
}
export interface LolLeaverBusterRestrictionInfoDto {
  "puuid": string;
  "leaverBusterEntryDto": LolLeaverBusterLeaverBusterEntryDto;
  "rankedRestrictionEntryDto": LolLeaverBusterRankedRestrictionEntryDto;
}
export type LolLicenseAgreementLicenseAgreementType = "PrivacyNotice" | "TermsOfUse";
export interface LolLoadoutsAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolLoadoutsCreateLoadoutDTO {
  "scope": string;
  "itemId"?: number;
  "name": string;
  "loadout": Record<string, LolLoadoutsItemKey>;
  "refreshTime": string;
}
export interface LolLoadoutsCreateLoadoutRequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": LolLoadoutsCreateLoadoutDTO;
}
export interface LolLoadoutsCreateOrUpdateItemsRequest {
  "id": number;
  "items": Record<string, unknown>;
  "inventoryJWTs": string[];
}
export interface LolLoadoutsFrontendInventoryResponse {
  "entitlements": LolLoadoutsItemKey[];
}
export interface LolLoadoutsGameflowGameData {
  "queue": LolLoadoutsQueue;
}
export type LolLoadoutsGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolLoadoutsGameflowSession {
  "phase": LolLoadoutsGameflowPhase;
  "gameData": LolLoadoutsGameflowGameData;
}
export interface LolLoadoutsGetItemsRequest {
  "id": number;
  "inventoryTypes": string[];
  "inventoryJWTs": string[];
}
export interface LolLoadoutsInventoryDTO {
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "items": Record<string, unknown>;
  "expires": string;
  "itemsJwt"?: string;
}
export interface LolLoadoutsInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "f2p": boolean;
  "rental": boolean;
  "lsb": boolean;
  "wins": number;
}
export interface LolLoadoutsInventoryResponseDTO {
  "data": LolLoadoutsInventoryDTO;
}
export interface LolLoadoutsItemKey {
  "inventoryType": string;
  "contentId": string;
  "itemId": number;
  "data": Record<string, string>;
}
export interface LolLoadoutsLoadout {
  "id": number;
  "name": string;
  "items": Record<string, unknown>;
}
export interface LolLoadoutsLoadoutRequestDTOBase {
  "serviceToJwtsMap": Record<string, unknown>;
}
export interface LolLoadoutsLoginSession {
  "state": LolLoadoutsLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
  "puuid": string;
}
export type LolLoadoutsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolLoadoutsQueue {
  "isTeamBuilderManaged": boolean;
}
export interface LolLoadoutsScopedLoadout {
  "scope": string;
  "itemId"?: number;
  "name": string;
  "loadout": Record<string, LolLoadoutsItemKey>;
  "refreshTime": string;
  "id": string;
}
export interface LolLoadoutsSignGCORequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": Record<string, LolLoadoutsItemKey>;
}
export interface LolLoadoutsUpdateLoadoutDTO {
  "id": string;
  "name": string;
  "loadout": Record<string, LolLoadoutsItemKey>;
}
export interface LolLoadoutsUpdateLoadoutRequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": LolLoadoutsUpdateLoadoutDTO;
}
export interface LolLobbyAccountIdAndSummonerId {
  "accountId": number;
  "summonerId": number;
}
export interface LolLobbyAgsSharedJoinCodeDto {
  "expiresAt": number;
  "isActive": boolean;
  "joinCode": string;
  "smartUrl": string;
}
export interface LolLobbyAmbassadorMessage {
  "httpStatus": number;
  "errorCode": string;
  "message": string;
  "implementationDetails": string;
  "payload": unknown;
}
export interface LolLobbyAutoFillQueueDto {
  "queueId": number;
  "autoFillEligible": boolean;
  "autoFillProtectedForStreaking": boolean;
  "autoFillProtectedForPromos": boolean;
  "overridePositionSelectionsWithFill": boolean;
  "autoFillProtectedForRemedy": boolean;
}
export interface LolLobbyBotChampionIdsByMapIdDto {
  "botChampionIdsByMapId": unknown;
}
export interface LolLobbyBotParticipantDto {
  "botId"?: string;
  "championId"?: number;
  "botSkillLevel"?: number;
  "team"?: string;
  "position"?: string;
}
export interface LolLobbyChampionSkinSelection {
  "championId": number;
  "skinId"?: number;
}
export interface LolLobbyChatBlockedPlayerResource {
  "summonerId": number;
  "name": string;
}
export interface LolLobbyChatFriend {
  "summonerId": number;
  "lol": Record<string, string>;
}
export interface LolLobbyChatFriendCounts {
  "numFriends": number;
  "numFriendsOnline": number;
  "numFriendsAvailable": number;
  "numFriendsAway": number;
  "numFriendsInQueue": number;
  "numFriendsInChampSelect": number;
  "numFriendsInGame": number;
  "numFriendsMobile": number;
}
export interface LolLobbyCollectionsChampion {
  "active": boolean;
  "botEnabled": boolean;
  "id": number;
  "name": string;
}
export interface LolLobbyCollectionsChampionMinimal {
  "disabledQueues": string[];
  "id": number;
  "ownership": LolLobbyCollectionsOwnership;
  "active": boolean;
  "freeToPlay": boolean;
}
export interface LolLobbyCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolLobbyCollectionsRental;
}
export interface LolLobbyCollectionsRental {
}
export type LolLobbyConfigReadinessEnum = "Disabled" | "NotReady" | "Ready";
export interface LolLobbyConfigStatus {
  "readiness": LolLobbyConfigReadinessEnum;
}
export type LolLobbyConfigType = "player" | "public";
export interface LolLobbyCustomEligibilityDto {
  "eligible": boolean;
  "restrictions": LolLobbyGatekeeperRestrictionDto[];
}
export interface LolLobbyCustomGameDto {
  "partyId": string;
  "gameType": string;
  "mapId": number;
  "ownerPuuid": string;
  "allowSpectators": string;
  "spectatorCount": number;
  "team1Count": number;
  "team2Count": number;
  "maxNumPlayers": number;
  "lobbyName": string;
  "privateGame": boolean;
}
export interface LolLobbyCustomJoinOptionsDto {
  "lobbyPassword": string;
  "team"?: string;
}
export interface LolLobbyEligibility {
  "queueId": number;
  "eligible": boolean;
  "restrictions": LolLobbyEligibilityRestriction[];
}
export interface LolLobbyEligibilityRestriction {
  "restrictionCode": LolLobbyEligibilityRestrictionCode;
  "restrictionArgs": Record<string, string>;
  "expiredTimestamp": number;
  "summonerIds": number[];
  "summonerIdsString": string;
  "puuids": string[];
  "puuidsString": string;
}
export type LolLobbyEligibilityRestrictionCode = "BanInfoNotAvailable" | "FullPartyUnranked" | "GameVersionMismatch" | "GameVersionMissing" | "GameVersionNotSupported" | "InventoryChampsInfoNotAvailable" | "InventoryQueuesInfoNotAvailable" | "LOLNewPlayerRestriction" | "LeaguesInfoNotAvailable" | "MinNormalGamesForRankedRestriction" | "MinorInfoNotAvailable" | "MmrStandardDeviationTooLarge" | "PlayerAvailableChampionRestriction" | "PlayerBannedRestriction" | "PlayerBingeRestriction" | "PlayerDisruptiveGameplayLockoutRestriction" | "PlayerDisruptiveVoiceTeamMuteWarning" | "PlayerDodgeRestriction" | "PlayerGameBasedRankRestriction" | "PlayerInGameRestriction" | "PlayerLeaverBustedRestriction" | "PlayerLeaverQueueLockoutRestriction" | "PlayerLeaverTaintedWarningRestriction" | "PlayerLevelRestriction" | "PlayerMaxLevelRestriction" | "PlayerMinLevelRestriction" | "PlayerMinorRestriction" | "PlayerNoRankedUpdatesDueToRankDisparity" | "PlayerQueueSuspendedRestriction" | "PlayerRankSoloOnlyRestriction" | "PlayerRankedSuspensionRestriction" | "PlayerReadyCheckFailRestriction" | "PlayerTimeBasedRankRestriction" | "PlayerTimePlayedRestriction" | "PlayerTimedRestriction" | "PrerequisiteQueuesNotPlayedRestriction" | "QPInsufficientPlayerChampionCoveragePopularChampion" | "QPInvalidChampionSelectionRestriction" | "QPInvalidNumberOfPlayerSlotsRestriction" | "QPInvalidPositionSelectionRestriction" | "QPNonUniquePrimarySlotChampionRestriction" | "QPNonUniquePrimarySlotPositionRestriction" | "QPNonUniquePrimarySlotRestriction" | "QPPartyChampionCoverageRestriction" | "QPPartyPositionCoverageRestriction" | "QPPlayerChampionCoverageRestriction" | "QPPlayerPositionCoverageRestriction" | "QPPlayerScarcePositionCoverageRestriction" | "QPScarcePositionsNotAvailableRestriction" | "QueueDisabled" | "QueueUnsupported" | "SeasonVersionLockout" | "SummonerInfoNotAvailable" | "TFTNewPlayerRestriction" | "TeamDivisionRestriction" | "TeamHighMMRMaxSizeRestriction" | "TeamMaxSizeRestriction" | "TeamMinSizeRestriction" | "TeamSizeRestriction" | "TeamSkillRestriction" | "TooManyIncompleteSubteamsRestriction" | "UnknownRestriction" | "UnsupportedClientPlatform" | "UserInfoNotAvailable";
export interface LolLobbyEntitlementsTokenResource {
  "accessToken": string;
  "token": string;
  "subject": string;
  "issuer": string;
  "entitlements": string[];
}
export interface LolLobbyFriendAvailabilityAnalytics {
  "puuid": string;
  "summonerId": number;
  "platformId": string;
  "eventType": string;
  "eventData": unknown;
  "eventTimestamp": number;
  "numFriends": number;
  "numFriendsOnline": number;
  "numFriendsAvailable": number;
  "numFriendsAway": number;
  "numFriendsInGame": number;
  "numFriendsMobile": number;
  "numFriendsInChampSelect": number;
  "numFriendsInQueue": number;
  "partyType": string;
}
export interface LolLobbyGameDataChampionSummary {
  "id": number;
  "alias": string;
}
export interface LolLobbyGameModeDto {
  "gameType": string;
  "queueId"?: number;
  "maxPartySize": number;
  "maxTeamSize": number;
  "allowSpectators"?: string;
  "mapId"?: number;
  "gameTypeConfigId"?: number;
  "gameCustomization"?: Record<string, string>;
  "lobbyName"?: string;
  "lobbyPassword"?: string;
  "customGameMode"?: string;
}
export interface LolLobbyGameflowGameClient {
  "running": boolean;
}
export interface LolLobbyGameflowGameData {
  "queue": LolLobbyQueue;
}
export interface LolLobbyGameflowGameDodge {
  "state": LolLobbyMatchmakingDodgeState;
  "dodgeIds": number[];
  "phase": LolLobbyGameflowPhase;
}
export type LolLobbyGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolLobbyGameflowSampleDto {
  "state": string;
  "probability": number;
  "intervalSecs": number;
  "tags": LolLobbyGameflowSampleTag[];
}
export type LolLobbyGameflowSampleTag = "GameVersionMissing" | "InventoryTokenMissing" | "RankedTokenMissing" | "SummonerTokenMissing" | "Unregistered" | "UserInfoTokenMissing";
export interface LolLobbyGameflowSession {
  "phase": LolLobbyGameflowPhase;
  "gameData": LolLobbyGameflowGameData;
  "gameClient": LolLobbyGameflowGameClient;
  "gameDodge": LolLobbyGameflowGameDodge;
}
export interface LolLobbyGatekeeperRestrictionDto {
  "accountId": number;
  "reason": string;
  "remainingMillis": number;
  "payload": string;
  "queueId": number;
  "puuid": string;
  "details": Record<string, string>;
}
export interface LolLobbyInventoryCacheEntry {
  "signedInventoryJwt": string;
  "expirationMS": number;
  "valid": boolean;
}
export interface LolLobbyInventoryItem {
  "itemId": number;
}
export type LolLobbyInvitationType = "invalid" | "lobby" | "party";
export type LolLobbyInviteContext = "DISCORD" | "LOL" | "RIOT" | "SELF_INVITE";
export interface LolLobbyJoinPartyAnalytics {
  "partyId": string;
  "platformId": string;
  "eventType": string;
  "eventData": unknown;
  "eventTimestamp": number;
  "numOpenParties": number;
  "numOpenFriends": number;
  "numPartyInvites": number;
  "numOtherInvites": number;
  "numTotalInvites": number;
  "numFriendsOnline": number;
  "partySize": number;
  "gameMode": string;
}
export interface LolLobbyLcdsDynamicClientConfig {
  "PartyRewards": LolLobbyLcdsPartyRewardsConfig;
}
export interface LolLobbyLcdsGameMetaData {
  "gameId": number;
  "mapId": number;
}
export interface LolLobbyLcdsPartyRewardsConfig {
  "Enabled": boolean;
}
export interface LolLobbyLobby {
  "queueId": number;
  "mapId": number;
  "gameMode": string;
  "invitationId": string;
  "multiUserChatId": string;
  "multiUserChatPassword": string;
  "mucJwtDto": LolLobbyMucJwtDto;
  "members": LolLobbyLobbyMember[];
  "localMember": LolLobbyLobbyMember;
  "invitations": LolLobbyLobbyInvitation[];
  "wasKicked": boolean;
  "removalReason": LolLobbyLobbyRemovedFromGameReason;
  "canStartMatchmaking": boolean;
  "showPositionSelector": boolean;
  "showPositionExcluder": boolean;
  "specifiablePositionPreferences": string[];
  "autoFillEligible": boolean;
  "customGameLobby"?: LolLobbyLobbyCustomGameLobby;
  "isCustom": boolean;
  "autoFillProtectedForStreaking": boolean;
  "autoFillProtectedForPromos": boolean;
  "isTeamBuilderManaged": boolean;
  "maximumParticipantListSize": number;
  "premadeSizeAllowed": boolean;
  "requiredPositionCoverageMet": boolean;
  "allowablePremadeSizes": number[];
  "queueAvailability": LolLobbyQueueAvailability;
}
export interface LolLobbyLobbyBotChampion {
  "active": boolean;
  "id": number;
  "name": string;
  "botDifficulties": LolLobbyLobbyBotDifficulty[];
}
export type LolLobbyLobbyBotDifficulty = "EASY" | "HARD" | "INTRO" | "MEDIUM" | "MLINTRO" | "NONE" | "RSBEGINNER" | "RSDOOMBOTS" | "RSINTERMEDIATE" | "RSINTRO" | "RSWARMINTRO" | "TUTORIAL" | "UBER";
export interface LolLobbyLobbyBotParams {
  "championId": number;
  "botDifficulty": LolLobbyLobbyBotDifficulty;
  "teamId": string;
  "position": string;
  "botUuid": string;
}
export interface LolLobbyLobbyChangeGameDto {
  "queueId": number;
  "customGameLobby"?: LolLobbyLobbyCustomGameLobby;
  "gameCustomization"?: Record<string, string>;
}
export interface LolLobbyLobbyChangeQueue {
  "queueId": number;
  "isCustom": boolean;
  "customGameLobby"?: LolLobbyLobbyCustomGameLobby;
}
export interface LolLobbyLobbyCustomChampSelectStartResponse {
  "success": boolean;
  "failedPlayers": LolLobbyLobbyCustomFailedPlayer[];
}
export interface LolLobbyLobbyCustomFailedPlayer {
  "summonerId": number;
  "summonerName": string;
  "reason": string;
}
export interface LolLobbyLobbyCustomGame {
  "id": number;
  "gameType": string;
  "mapId": number;
  "ownerDisplayName": string;
  "spectatorPolicy": string;
  "filledSpectatorSlots": number;
  "maxSpectatorSlots": number;
  "filledPlayerSlots": number;
  "maxPlayerSlots": number;
  "lobbyName": string;
  "hasPassword": boolean;
  "passbackUrl": string;
  "partyId": string;
}
export interface LolLobbyLobbyCustomGameConfiguration {
  "mapId": number;
  "gameMode": string;
  "mutators": LolLobbyQueueGameTypeConfig;
  "gameTypeConfig": LolLobbyQueueGameTypeConfig;
  "spectatorPolicy": LolLobbyQueueCustomGameSpectatorPolicy;
  "teamSize": number;
  "maxPlayerCount": number;
  "tournamentGameMode": string;
  "tournamentPassbackUrl": string;
  "tournamentPassbackDataPacket": string;
  "gameServerRegion": string;
  "spectatorDelayEnabled": boolean;
  "hidePublicly": boolean;
  "aramMapMutator": string;
}
export interface LolLobbyLobbyCustomGameLobby {
  "lobbyName": string;
  "lobbyPassword": string;
  "configuration": LolLobbyLobbyCustomGameConfiguration;
  "teamOne": LolLobbyLobbyMember[];
  "teamTwo": LolLobbyLobbyMember[];
  "spectators": LolLobbyLobbyMember[];
  "practiceGameRewardsDisabledReasons": string[];
  "gameId": number;
}
export interface LolLobbyLobbyCustomJoinParameters {
  "password"?: string;
  "asSpectator"?: boolean;
}
export interface LolLobbyLobbyDto {
  "partyId": string;
  "partyType": string;
  "members": LolLobbyLobbyParticipantDto[];
  "localMember": LolLobbyLobbyParticipantDto;
  "invitations": LolLobbyLobbyInvitationDto[];
  "canStartActivity": boolean;
  "restrictions"?: LolLobbyEligibilityRestriction[];
  "warnings"?: LolLobbyEligibilityRestriction[];
  "gameConfig": LolLobbyLobbyGameConfigDto;
  "multiUserChatId": string;
  "multiUserChatPassword": string;
  "mucJwtDto": LolLobbyMucJwtDto;
  "scarcePositions": string[];
  "popularChampions": number[];
}
export interface LolLobbyLobbyGameConfigDto {
  "gameMode": string;
  "mapId": number;
  "queueId": number;
  "pickType": string;
  "maxTeamSize": number;
  "maxLobbySize": number;
  "maxHumanPlayers": number;
  "numberOfTeamsInLobby": number;
  "maxLobbySpectatorCount": number;
  "numPlayersPerTeam": number;
  "allowablePremadeSizes": number[];
  "premadeSizeAllowed": boolean;
  "isTeamBuilderManaged": boolean;
  "isCustom": boolean;
  "showPositionSelector": boolean;
  "showQuickPlaySlotSelection": boolean;
  "isLobbyFull": boolean;
  "shouldForceScarcePositionSelection": boolean;
  "customLobbyName": string;
  "customMutatorName": string;
  "customTeam100": LolLobbyLobbyParticipantDto[];
  "customTeam200": LolLobbyLobbyParticipantDto[];
  "customSpectators": LolLobbyLobbyParticipantDto[];
  "customSpectatorPolicy": LolLobbyQueueCustomGameSpectatorPolicy;
  "customRewardsDisabledReasons": string[];
}
export interface LolLobbyLobbyInvitation {
  "id": string;
  "fromSummonerId": number;
  "toSummonerId": number;
  "state": LolLobbyLobbyInvitationState;
  "errorType": string;
  "timestamp": string;
  "invitationMetaData": unknown;
  "eligibility": LolLobbyEligibility;
  "fromSummonerName": string;
  "toSummonerName": string;
}
export interface LolLobbyLobbyInvitationDto {
  "invitationId": string;
  "toSummonerId": number;
  "toPuuid": string;
  "state": LolLobbyLobbyInvitationState;
  "timestamp": string;
  "toSummonerName": string;
  "invitationType": LolLobbyInvitationType;
}
export type LolLobbyLobbyInvitationState = "Accepted" | "Declined" | "Error" | "Joined" | "Kicked" | "OnHold" | "Pending" | "Requested";
export interface LolLobbyLobbyLastQueuedLobby {
  "queueId": number;
  "wasOwner": boolean;
  "canPlayAgain": boolean;
  "members": LolLobbyLobbyLastQueuedMember[];
}
export interface LolLobbyLobbyLastQueuedMember {
  "id": number;
}
export interface LolLobbyLobbyMatchmakingLowPriorityDataResource {
  "penalizedSummonerIds": number[];
  "penaltyTime": number;
  "penaltyTimeRemaining": number;
  "bustedLeaverAccessToken": string;
  "reason": string;
}
export interface LolLobbyLobbyMatchmakingSearchErrorResource {
  "id": number;
  "errorType": string;
  "penalizedSummonerId": number;
  "penaltyTimeRemaining": number;
  "message": string;
}
export interface LolLobbyLobbyMatchmakingSearchResource {
  "searchState": LolLobbyLobbyMatchmakingSearchState;
  "lowPriorityData": LolLobbyLobbyMatchmakingLowPriorityDataResource;
  "errors": LolLobbyLobbyMatchmakingSearchErrorResource[];
}
export type LolLobbyLobbyMatchmakingSearchState = "AbandonedLowPriorityQueue" | "Canceled" | "Error" | "Found" | "Invalid" | "Searching" | "ServiceError" | "ServiceShutdown";
export interface LolLobbyLobbyMember {
  "id": number;
  "isOwner": boolean;
  "isSpectator": boolean;
  "canInviteOthers": boolean;
  "positionPreferences": LolLobbyLobbyPositionPreferences;
  "excludedPositionPreference"?: string;
  "summonerInternalName": string;
  "showPositionExcluder": boolean;
  "autoFillEligible": boolean;
  "autoFillProtectedForStreaking": boolean;
  "autoFillProtectedForPromos": boolean;
  "autoFillProtectedForSoloing": boolean;
  "isBot": boolean;
  "botDifficulty": LolLobbyLobbyBotDifficulty;
  "botChampionId": number;
  "position": string;
  "botUuid": string;
}
export interface LolLobbyLobbyNotification {
  "notificationId": string;
  "notificationReason": string;
  "summonerIds": number[];
  "timestamp": number;
}
export interface LolLobbyLobbyParticipantDto {
  "summonerId": number;
  "summonerIconId": number;
  "summonerName": string;
  "summonerInternalName": string;
  "puuid": string;
  "summonerLevel": number;
  "allowedStartActivity": boolean;
  "allowedChangeActivity": boolean;
  "allowedToggleInvite": boolean;
  "allowedKickOthers": boolean;
  "allowedInviteOthers": boolean;
  "isLeader": boolean;
  "isSpectator": boolean;
  "teamId": number;
  "firstPositionPreference": string;
  "secondPositionPreference": string;
  "thirdPositionPreference"?: string;
  "fourthPositionPreference"?: string;
  "fifthPositionPreference"?: string;
  "memberData"?: Record<string, string>;
  "subteamIndex"?: number;
  "intraSubteamPosition"?: number;
  "strawberryMapId"?: string;
  "playerSlots": LolLobbyQuickPlayPresetSlotDto[];
  "ready": boolean;
  "showGhostedBanner": boolean;
  "autoFillEligible": boolean;
  "autoFillProtectedForStreaking": boolean;
  "autoFillProtectedForPromos": boolean;
  "autoFillProtectedForSoloing": boolean;
  "autoFillProtectedForRemedy": boolean;
  "isBot": boolean;
  "botId": string;
  "botDifficulty": LolLobbyLobbyBotDifficulty;
  "botChampionId": number;
  "botPosition": string;
  "botUuid": string;
}
export type LolLobbyLobbyPartyRewardType = "Icon" | "Ip" | "None";
export interface LolLobbyLobbyPartyRewards {
  "isEnabled": boolean;
  "queueId": number;
  "isCustom": boolean;
  "partyRewards": LolLobbyPartyReward[];
}
export interface LolLobbyLobbyPositionPreferences {
  "firstPreference": string;
  "secondPreference": string;
  "thirdPreference"?: string;
  "fourthPreference"?: string;
  "fifthPreference"?: string;
}
export type LolLobbyLobbyRemovedFromGameReason = "Disbanded" | "GameStartError" | "Kicked" | "Left" | "None" | "Other" | "ServiceError" | "ServiceShutdown" | "Timeout";
export interface LolLobbyLobbyStatus {
  "queueId": number;
  "isCustom": boolean;
  "isPracticeTool": boolean;
  "isLeader": boolean;
  "isSpectator": boolean;
  "allowedPlayAgain": boolean;
  "isNoSpectateDelay": boolean;
  "memberSummonerIds": number[];
  "invitedSummonerIds": number[];
  "lobbyId"?: string;
  "customSpectatorPolicy": LolLobbyQueueCustomGameSpectatorPolicy;
}
export interface LolLobbyLobbyTimer {
  "enabled": boolean;
  "countdown": number;
}
export interface LolLobbyLoginSession {
  "state": LolLobbyLoginSessionStates;
  "username": string;
  "userAuthToken": string;
  "accountId": number;
  "summonerId": number;
  "idToken": string;
  "puuid": string;
  "connected": boolean;
}
export type LolLobbyLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export type LolLobbyMatchmakingDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged";
export interface LolLobbyMucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface LolLobbyMultiProductRegistrationDto {
  "simpleInventoryToken"?: string;
  "playerTokens"?: Record<string, string>;
  "experiments"?: Record<string, string>;
  "productRegistrations": Record<string, LolLobbyProductRegistration>;
}
export interface LolLobbyOpenPartyToggleAnalytics {
  "partyId": string;
  "platformId": string;
  "eventType": string;
  "eventData": unknown;
  "eventTimestamp": number;
  "playerId": string;
  "initialState": string;
  "finalState": string;
  "numOfToggles": number;
  "startTimestamp": number;
  "endTimestamp": number;
  "elapsedTime": number;
  "startTransition": string;
  "endTransition": string;
  "gameMode": string;
}
export interface LolLobbyPartiesInvitationAnalytics {
  "partyId": string;
  "platformId": string;
  "eventType": string;
  "eventData": unknown;
  "eventTimestamp": number;
  "players": LolLobbyPartiesInvitationPlayerAnalytics[];
}
export interface LolLobbyPartiesInvitationPlayerAnalytics {
  "puuid": string;
  "summonerId": number;
  "role": string;
}
export interface LolLobbyPartyChatDto {
  "jid": string;
  "mucJwtDto": LolLobbyMucJwtDto;
}
export interface LolLobbyPartyDto {
  "partyId": string;
  "platformId": string;
  "players": LolLobbyPartyMemberDto[];
  "chat": LolLobbyPartyChatDto;
  "maxPartySize": number;
  "partyType": string;
  "gameMode": LolLobbyGameModeDto;
  "activityLocked": boolean;
  "version": number;
  "activityStartedUtcMillis": number;
  "activityResumeUtcMillis": number;
  "activeRestrictions": LolLobbyQueueRestrictionDto;
  "eligibilityHash": number;
  "eligibilityRestrictions"?: LolLobbyGatekeeperRestrictionDto[];
  "eligibilityWarnings"?: LolLobbyGatekeeperRestrictionDto[];
  "botParticipants"?: LolLobbyBotParticipantDto[];
}
export type LolLobbyPartyEogStatusCategory = "kLeft" | "kOnEog" | "kPlayAgain";
export interface LolLobbyPartyInviteAnalytics {
  "partyId": string;
  "platformId": string;
  "eventType": string;
  "eventData": unknown;
  "eventTimestamp": number;
  "fromSummonerId": number;
  "toSummonerId": number;
  "partyType": string;
  "gameMode": string;
}
export interface LolLobbyPartyMemberDto {
  "platformId": string;
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "partyId": string;
  "partyVersion": number;
  "role": LolLobbyPartyMemberRoleEnum;
  "gameMode"?: LolLobbyGameModeDto;
  "ready"?: boolean;
  "metadata": LolLobbyPartyMemberMetadataDto;
  "inviteContext": LolLobbyInviteContext;
  "invitedByPuuid"?: string;
  "invitedBySummonerId"?: number;
  "inviteTimestamp"?: number;
  "canInvite"?: boolean;
  "team": string;
}
export interface LolLobbyPartyMemberMetadataDto {
  "positionPref": string[];
  "properties"?: unknown;
  "memberData"?: unknown;
  "playerSlots": LolLobbyQuickPlayPresetSlotDto[];
  "subteamData"?: LolLobbySubteamDataDto;
}
export type LolLobbyPartyMemberRoleEnum = "DECLINED" | "HOLD" | "INVITED" | "KICKED" | "LEADER" | "MEMBER" | "NONE";
export interface LolLobbyPartyNotificationEnvelopeDto {
  "player"?: LolLobbyPlayerDto;
  "queueRestriction"?: LolLobbyQueueRestrictionDto;
}
export interface LolLobbyPartyPresenceData {
  "isPartyOpen": boolean;
  "agsActivityId": string;
  "partyId": string;
  "queueId": number;
  "summoners": number[];
  "summonerPuuids": string[];
  "maxPlayers": number;
}
export interface LolLobbyPartyQueueEligibilityDto {
  "partyRestrictions": LolLobbyGatekeeperRestrictionDto[];
  "availableQueueIds": number[];
}
export interface LolLobbyPartyReward {
  "premadeSize": number;
  "type": LolLobbyLobbyPartyRewardType;
  "value": string;
}
export interface LolLobbyPartyStatusDto {
  "readyPlayers": string[];
  "leftPlayers": string[];
  "eogPlayers": string[];
  "partySize": number;
}
export interface LolLobbyPlayerCollectionDto {
  "players": LolLobbyPlayerDto[];
}
export interface LolLobbyPlayerDto {
  "puuid": string;
  "platformId": string;
  "accountId": number;
  "summonerId": number;
  "eligibilityHash": number;
  "serverUtcMillis": number;
  "parties"?: LolLobbyPartyMemberDto[];
  "currentParty"?: LolLobbyPartyDto;
  "registration": LolLobbyRegistrationCredentials;
  "multiProductRegistration"?: LolLobbyMultiProductRegistrationDto;
  "createdAt": number;
  "version": number;
}
export interface LolLobbyPlayerInviteDto {
  "puuid": string;
  "inviteContext": LolLobbyInviteContext;
}
export interface LolLobbyPlayerStatus {
  "currentLobbyStatus"?: LolLobbyLobbyStatus;
  "lastQueuedLobbyStatus"?: LolLobbyLobbyStatus;
  "canInviteOthersAtEog": boolean;
}
export type LolLobbyPlayerUpdateType = "Direct" | "None" | "RMS" | "ServiceProxy";
export interface LolLobbyPremadeMemberDto {
  "displayName": string;
  "gameName": string;
  "tagLine": string;
  "puuid": string;
  "partyId": string;
  "summonerId": number;
  "role": LolLobbyPartyMemberRoleEnum;
}
export interface LolLobbyPremadePartyDto {
  "partyId": string;
  "commsEnabled": boolean;
  "players": Record<string, LolLobbyPremadeMemberDto>;
}
export interface LolLobbyPremadeRelationshipAnalytics {
  "puuid": string;
  "summonerId": number;
  "platformId": string;
  "eventType": string;
  "eventData": unknown;
  "eventTimestamp": number;
  "premadePlayers": string[];
  "friendPlayers": string[];
}
export interface LolLobbyProductRegistration {
  "gameClientVersion"?: string;
  "meetsMinSpec"?: boolean;
}
export interface LolLobbyProductStateDto {
  "isUpToDate": boolean;
}
export interface LolLobbyQueue {
  "id": number;
  "mapId": number;
  "name": string;
  "shortName": string;
  "description": string;
  "detailedDescription": string;
  "type": string;
  "gameMode": string;
  "assetMutator": string;
  "maxTierForPremadeSize2": string;
  "maxDivisionForPremadeSize2": string;
  "category": LolLobbyQueueGameCategory;
  "gameTypeConfig": LolLobbyQueueGameTypeConfig;
  "numPlayersPerTeam": number;
  "minimumParticipantListSize": number;
  "maximumParticipantListSize": number;
  "minLevel": number;
  "isRanked": boolean;
  "areFreeChampionsAllowed": boolean;
  "isTeamBuilderManaged": boolean;
  "queueAvailability": LolLobbyQueueAvailability;
  "isVisible": boolean;
  "queueRewards": LolLobbyQueueReward;
  "spectatorEnabled": boolean;
  "championsRequiredToPlay": number;
  "allowablePremadeSizes": number[];
  "showPositionSelector": boolean;
  "showQuickPlaySlotSelection": boolean;
  "lastToggledOffTime": number;
  "lastToggledOnTime": number;
  "removalFromGameAllowed": boolean;
  "removalFromGameDelayMinutes": number;
  "hidePlayerPosition": boolean;
  "gameSelectModeGroup": string;
  "gameSelectCategory": string;
  "gameSelectPriority": number;
  "isSkillTreeQueue": boolean;
  "isBotHonoringAllowed": boolean;
  "isCustom": boolean;
  "numberOfTeamsInLobby": number;
  "maxLobbySpectatorCount": number;
  "pickMode": string;
}
export type LolLobbyQueueAvailability = "Available" | "DoesntMeetRequirements" | "PlatformDisabled";
export interface LolLobbyQueueCustomGame {
  "queueAvailability": LolLobbyQueueAvailability;
}
export type LolLobbyQueueCustomGameSpectatorPolicy = "AllAllowed" | "FriendsAllowed" | "LobbyAllowed" | "NotAllowed";
export type LolLobbyQueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface LolLobbyQueueGameTypeConfig {
  "id": number;
  "name": string;
  "maxAllowableBans": number;
  "allowTrades": boolean;
  "exclusivePick": boolean;
  "duplicatePick": boolean;
  "teamChampionPool": boolean;
  "crossTeamChampionPool": boolean;
  "advancedLearningQuests": boolean;
  "battleBoost": boolean;
  "deathMatch": boolean;
  "doNotRemove": boolean;
  "learningQuests": boolean;
  "onboardCoopBeginner": boolean;
  "reroll": boolean;
  "mainPickTimerDuration": number;
  "postPickTimerDuration": number;
  "banTimerDuration": number;
  "pickMode": string;
  "banMode": string;
  "gameModeOverride"?: string;
  "numPlayersPerTeamOverride"?: number;
}
export interface LolLobbyQueueRestrictionDto {
  "gatekeeperRestrictions": LolLobbyGatekeeperRestrictionDto[];
}
export interface LolLobbyQueueReward {
  "isIpEnabled": boolean;
  "isXpEnabled": boolean;
  "isChampionPointsEnabled": boolean;
  "partySizeIpRewards": number[];
}
export interface LolLobbyQuickPlayPresetSlotDto {
  "championId": number;
  "skinId": number;
  "positionPreference": string;
  "perks": string;
  "spell1": number;
  "spell2": number;
}
export interface LolLobbyRankedPositionInfoDTO {
  "queue": string;
  "tier": string;
  "rank": string;
}
export interface LolLobbyRankedRestrictionInfo {
  "punishedGamesRemaining": number;
  "needsAck": boolean;
}
export interface LolLobbyRankedStatsUnsignedDTO {
  "queues": LolLobbyRankedPositionInfoDTO[];
  "highestPreviousSeasonEndTier": string;
  "highestPreviousSeasonEndRank": string;
  "jwt": string;
}
export interface LolLobbyReadyDto {
  "ready": boolean;
}
export interface LolLobbyReceivedInvitationDto {
  "invitationId": string;
  "fromPuuid": string;
  "fromSummonerId": number;
  "state": LolLobbyLobbyInvitationState;
  "timestamp": string;
  "fromSummonerName": string;
  "canAcceptInvitation": boolean;
  "restrictions": LolLobbyEligibilityRestriction[];
  "gameConfig": LolLobbyReceivedInvitationGameConfigDto;
  "isSelfInvite": boolean;
  "invitationType": LolLobbyInvitationType;
}
export interface LolLobbyReceivedInvitationGameConfigDto {
  "gameMode": string;
  "queueId": number;
  "mapId": number;
  "inviteGameType": string;
}
export interface LolLobbyRegistrationCredentials {
  "summonerToken"?: string;
  "simpleInventoryToken"?: string;
  "rankedOverviewToken"?: string;
  "gameClientVersion"?: string;
  "playerTokens"?: Record<string, string>;
  "experiments"?: Record<string, string>;
}
export interface LolLobbyRegistrationStatus {
  "complete": boolean;
  "errorCodes": string[];
}
export interface LolLobbyRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolLobbyServiceProxyPayload {
  "method": string;
  "url": string;
  "body": string;
}
export interface LolLobbySetGameModeRequestDto {
  "queueId"?: number;
  "gameCustomization"?: Record<string, string>;
  "lobbyName"?: string;
  "lobbyPassword"?: string;
  "maxTeamSize"?: number;
  "allowSpectators"?: string;
  "displayLobbyInCustomGameBrowser"?: boolean;
}
export interface LolLobbyStrawberryMapUpdateDto {
  "contentId": string;
  "itemId": number;
}
export interface LolLobbySubteamDataDto {
  "subteamIndex": number;
  "intraSubteamPosition": number;
}
export interface LolLobbySummoner {
  "summonerId": number;
  "summonerLevel": number;
  "accountId": number;
  "puuid": string;
  "profileIconId": number;
  "displayName": string;
  "internalName": string;
  "gameName": string;
  "tagLine": string;
}
export interface LolLobbyTeamBuilderChampSelectDevPanelData {
  "counter": number;
  "dtoIndex": number;
  "queueId": number;
  "teamIdSuffix": number;
}
export interface LolLobbyTeamBuilderCountdownTimer {
  "phaseName": string;
  "timer": number;
  "counter": number;
}
export interface LolLobbyTeamBuilderMatchmakingSearch {
  "searchState": LolLobbyTeamBuilderMatchmakingSearchState;
}
export type LolLobbyTeamBuilderMatchmakingSearchState = "AbandonedLowPriorityQueue" | "Canceled" | "Error" | "Found" | "Invalid" | "Searching" | "ServiceError" | "ServiceShutdown";
export type LolLobbyTeamBuilderRiotMessagingServiceState = "Connected" | "Connecting" | "DisconnectRequested" | "Disconnected" | "Disconnecting" | "SwitchingServers";
export interface LolLobbyUserInfoToken {
  "userInfo": string;
}
export interface LolLobbyUserResource {
  "summonerId": number;
  "lol": Record<string, string>;
}
export interface LolLockAndLoadHomeHubsWaits {
  "initialWait": number;
  "additionalWait": number;
}
export interface LolLoginAccessToken {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolLoginAccountStateResource {
  "state": LolLoginAccountStateType;
}
export type LolLoginAccountStateType = "CREATING" | "ENABLED" | "GENERATING" | "TRANSFERRED_OUT" | "TRANSFERRING_IN" | "TRANSFERRING_OUT" | "TRANSFER_FAILED";
export interface LolLoginAuthorization {
  "currentPlatformId": string;
  "currentAccountId": number;
  "subject": string;
}
export type LolLoginConfigReadinessEnum = "Disabled" | "NotReady" | "Ready";
export interface LolLoginConfigStatus {
  "readiness": LolLoginConfigReadinessEnum;
}
export type LolLoginConfigType = "player" | "public";
export interface LolLoginCrashReportingEnvironment {
  "environment": string;
  "userName": string;
  "userId": string;
}
export interface LolLoginIdToken {
  "token": string;
  "expiry": number;
}
export interface LolLoginLcdsResponse {
  "typeName": string;
  "body": unknown;
}
export interface LolLoginLcdsServiceProxyResponse {
  "serviceName": string;
  "methodName": string;
  "messageId": string;
  "status": string;
  "payload": string;
  "compressedPayload": boolean;
}
export type LolLoginLeagueSessionStatus = "ANTI_ADDICTION_EXPIRED" | "DUPLICATED" | "EXPIRED" | "INITIALIZED" | "UNINITIALIZED";
export interface LolLoginLeagueSessionTokenEnvelope {
  "token"?: string;
}
export type LolLoginLoginConnectionMode = "Legacy" | "Partner" | "Preparing" | "RiotClient";
export interface LolLoginLoginConnectionState {
  "mode": LolLoginLoginConnectionMode;
  "isUsingDeveloperAuthToken": boolean;
  "isPartnerRiotClient": boolean;
}
export interface LolLoginLoginError {
  "errorCode": string;
  "messageId": string;
  "description": string;
}
export interface LolLoginLoginQueue {
  "estimatedPositionInQueue": number;
  "approximateWaitTimeSeconds"?: number;
  "maxDisplayedPosition"?: number;
  "maxDisplayedWaitTimeSeconds"?: number;
}
export interface LolLoginLoginSession {
  "state": LolLoginLoginSessionStates;
  "username": string;
  "userAuthToken": string;
  "accountId": number;
  "summonerId"?: number;
  "isInLoginQueue": boolean;
  "error"?: LolLoginLoginError;
  "idToken": string;
  "puuid": string;
  "isNewPlayer": boolean;
  "connected": boolean;
}
export type LolLoginLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolLoginPlatformGeneratedCredentials {
  "username": string;
  "password": string;
}
export interface LolLoginRSOConfigReadyState {
  "ready": boolean;
}
export interface LolLoginRSOPlayerCredentials {
  "username": string;
  "password": string;
  "platformId": string;
}
export interface LolLoginRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolLoginSummonerCreatedResource {
  "summonerId": number;
}
export interface LolLoginSummonerSessionResource {
  "summonerId": number;
  "displayName": string;
  "isNewPlayer": boolean;
}
export interface LolLoginTransferNotification {
  "transactionId": string;
  "sourcePlatform": string;
  "destinationPlatform": string;
  "state": string;
}
export interface LolLoginUsernameAndPassword {
  "username": string;
  "password": string;
}
export type LolLootCelebrationType = "FULLSCREEN" | "NONE" | "TOAST";
export interface LolLootCollectionsChampionMinimal {
  "id": number;
  "ownership": LolLootCollectionsOwnership;
}
export interface LolLootCollectionsChampionSkinMinimal {
  "championId": number;
  "id": number;
  "name": string;
  "ownership": LolLootCollectionsOwnership;
  "splashPath": string;
  "tilePath": string;
}
export interface LolLootCollectionsEmote {
  "itemId": number;
  "ownershipType": LolLootInventoryOwnership;
}
export interface LolLootCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolLootCollectionsRental;
}
export interface LolLootCollectionsRental {
  "rented": boolean;
}
export interface LolLootCollectionsStatstone {
  "itemId": number;
  "ownershipType": LolLootInventoryOwnership;
}
export interface LolLootCollectionsSummonerIcon {
  "itemId": number;
}
export interface LolLootCollectionsWardSkin {
  "id": number;
  "name": string;
  "ownership": LolLootCollectionsOwnership;
  "wardImagePath": string;
  "wardShadowImagePath": string;
}
export interface LolLootContextMenu {
  "name": string;
  "actionType": string;
  "recipeDescription": string;
  "recipeContextMenuAction": string;
  "enabled": boolean;
  "essenceType": string;
  "essenceQuantity": number;
  "requiredTokens": string;
  "requiredOthers": string;
  "requiredOthersName": string;
  "requiredOthersCount": number;
}
export interface LolLootCosmeticsTFTDamageSkin {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "level": number;
  "groupId": number;
  "groupName": string;
  "upgrades": string[];
}
export interface LolLootCosmeticsTFTDamageSkinViewModel {
  "contentId": string;
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
  "rarityValue": number;
  "purchaseDate": string;
  "isRecentItem": boolean;
  "level": number;
  "groupId": number;
  "groupName": string;
  "upgrades": LolLootCosmeticsTFTDamageSkinViewModel[];
}
export interface LolLootCosmeticsTFTMapSkinViewModel {
  "itemId": number;
  "name": string;
  "description": string;
  "loadoutsIcon": string;
  "owned": boolean;
  "selected": boolean;
  "loyalty": boolean;
  "f2p": boolean;
}
export interface LolLootCounter {
  "id": string;
  "name": string;
  "groupId": string;
  "direction": string;
  "startValue": number;
}
export interface LolLootCounterInstance {
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "counterValue": number;
}
export interface LolLootCurrencyConfiguration {
  "currenciesUsingCapWallets": string[];
}
export interface LolLootEntityInstance {
  "schemaVersion": string;
  "groupId": string;
  "counters": LolLootCounterInstance[];
  "milestones": LolLootMilestoneInstance[];
}
export interface LolLootFSC {
  "id": string;
  "canvas": LolLootFSCCanvas;
  "media": LolLootFSCMedia;
  "rewards": LolLootFSCRewards[];
}
export interface LolLootFSCCanvas {
  "title": string;
  "subtitle": string;
  "description": string;
  "canvasBackgroundImage": string;
  "canvasSize": LolLootFSCCanvasSize;
  "canvasDesign": string;
  "buttonText": string;
}
export type LolLootFSCCanvasSize = "FULL" | "LARGE" | "MEDIUM" | "SMALL";
export interface LolLootFSCMedia {
  "introAnimation": string;
  "introAnimationAudio": string;
  "introLowSpecImage": string;
  "loopAnimation": string;
  "loopAnimationAudio": string;
  "transitionAnimation": string;
  "transitionAnimationAudio": string;
}
export interface LolLootFSCRewards {
  "itemId": number;
  "image": string;
  "imageOverlay": string;
  "title": string;
  "subtitle": string;
}
export interface LolLootGameDataNexusFinisher {
  "itemId": number;
  "name": string;
  "translatedName": string;
  "iconPath": string;
  "splashPath": string;
  "videoPath": string;
}
export interface LolLootGameDataSummonerEmote {
  "id": number;
  "name": string;
  "inventoryIcon": string;
  "description": string;
}
export interface LolLootGameDataSummonerIcon {
  "id": number;
  "title": string;
  "imagePath": string;
}
export type LolLootGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolLootGameflowSession {
  "phase": LolLootGameflowPhase;
}
export type LolLootGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolLootGrantorDescription {
  "appName": string;
  "entityId": string;
}
export interface LolLootGroup {
  "id": string;
  "schemaVersion": string;
  "productId": string;
  "name": string;
  "repeat": LolLootRepeat;
  "counters": LolLootCounter[];
  "milestones": LolLootMilestone[];
}
export type LolLootInventoryOwnership = "F2P" | "OWNED" | "RENTED";
export interface LolLootItemKey {
  "inventoryType": string;
  "itemId": number;
}
export type LolLootItemOwnershipStatus = "FREE" | "NONE" | "OWNED" | "RENTAL";
export interface LolLootLoginSession {
  "state": LolLootLoginSessionStates;
  "summonerId": number;
  "accountId": number;
}
export type LolLootLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolLootLootBundleContentGdsResource {
  "localizedDescription": string;
}
export interface LolLootLootBundleGdsResource {
  "id": string;
  "description": string;
  "descriptionLong": string;
  "image": string;
  "contents": LolLootLootBundleContentGdsResource[];
}
export interface LolLootLootDataGdsResource {
  "LootItems": LolLootLootItemGdsResource[];
  "LootRecipes": LolLootLootRecipeGdsResource[];
  "LootTables": LolLootLootTableGdsResource[];
  "LootBundles": LolLootLootBundleGdsResource[];
}
export interface LolLootLootDescription {
  "lootName": string;
  "localizedDescription": string;
  "localizedDescriptionLong": string;
  "imagePath": string;
  "childLootTableNames": string[];
  "childrenDescriptions": LolLootLootDescription[];
}
export interface LolLootLootDropTableEntryGdsResource {
  "lootId": string;
  "localizedDescription": string;
}
export interface LolLootLootGrantNotification {
  "id": number;
  "gameId": number;
  "playerId": number;
  "championId": number;
  "playerGrade": string;
  "lootName": string;
  "messageKey": string;
  "msgId": string;
  "accountId": number;
}
export interface LolLootLootItem {
  "lootName": string;
  "asset": string;
  "type": string;
  "rarity": string;
  "value": number;
  "storeItemId": number;
  "upgradeLootName": string;
  "expiryTime": number;
  "tags": string;
  "displayCategories": string;
  "rentalSeconds": number;
  "rentalGames": number;
}
export interface LolLootLootItemGdsResource {
  "id": string;
  "name": string;
  "description": string;
  "image": string;
  "startDate": string;
  "endDate": string;
  "recipeMenuTitle": string;
  "recipeMenuSubtitle": string;
  "mappedStoreId": number;
  "lifetimeMax": number;
  "autoRedeem": boolean;
  "recipeMenuActive": boolean;
  "rarity": LolLootLootRarity;
  "type": LolLootLootType;
}
export interface LolLootLootMilestone {
  "id": string;
  "threshold": number;
  "rewards": LolLootLootMilestoneReward[];
}
export type LolLootLootMilestoneClaimStatus = "COMPLETED" | "FAILED" | "IN_PROGRESS" | "NOT_STARTED";
export interface LolLootLootMilestoneRepeat {
  "repeatCount": number;
  "repeatScope": number;
  "multiplier": number;
}
export interface LolLootLootMilestoneReward {
  "rewardGroupId": string;
  "rewardType": string;
  "itemInstanceId": string;
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
  "lootItem"?: LolLootPlayerLoot;
}
export interface LolLootLootMilestones {
  "id": string;
  "progressionConfigId": string;
  "active": boolean;
  "startDate": string;
  "endDate": string;
  "storeGroupTitle": string;
  "repeat": LolLootLootMilestoneRepeat;
  "lootItems": string[];
  "recipes": string[];
  "milestones": LolLootLootMilestone[];
  "errorCachingMilestoneSet": boolean;
}
export interface LolLootLootMilestonesClaimResponse {
  "lootMilestoneSetId": string;
  "claimedMilestones": string[];
  "status": LolLootLootMilestoneClaimStatus;
}
export interface LolLootLootMilestonesCounter {
  "lootMilestonesId": string;
  "counterValue": number;
  "completedLoops": number;
  "readyToClaimMilestones": string[];
}
export interface LolLootLootMilestonesDataGdsResource {
  "id": string;
  "storeGroupTitle": string;
  "startDate": string;
  "endDate": string;
  "recipes": LolLootMilestonesRecipeGdsResource[];
  "progressTrack": LolLootProgressionConfigGdsResource;
}
export interface LolLootLootOddsResponse {
  "lootId": string;
  "parentId": string;
  "dropRate": number;
  "quantity": number;
  "label": string;
  "query": string;
  "lootOrder": number;
  "children": LolLootLootOddsResponse[];
}
export interface LolLootLootOutputGdsResource {
  "lootId": string;
  "localizedDescription": string;
}
export type LolLootLootRarity = "Default" | "Epic" | "Legendary" | "Mythic" | "Ultimate";
export interface LolLootLootRecipeGdsResource {
  "id": string;
  "description": string;
  "contextMenuText": string;
  "requirementText": string;
  "imagePath": string;
  "introVideoPath": string;
  "loopVideoPath": string;
  "outroVideoPath": string;
  "hasVisibleLootOdds": boolean;
  "outputs": LolLootLootOutputGdsResource[];
  "singleOpen": boolean;
}
export interface LolLootLootTableGdsResource {
  "id": string;
  "description": string;
  "descriptionLong": string;
  "image": string;
  "dropChance": LolLootLootDropTableEntryGdsResource[];
}
export type LolLootLootType = "Boost" | "Chest" | "Companion" | "Currency" | "Egg" | "Egg_Color" | "Material" | "Nexus_Finisher" | "Skin" | "SkinBorder" | "Skin_Rental" | "Statstone" | "Statstone_Shard" | "SummonerIcon" | "TFT_Damage_Skin" | "TFT_Map_Skin" | "WardSkin";
export interface LolLootMassDisenchantClientConfig {
  "maxLootItemsSizeMassCraft": number;
  "enabled": boolean;
}
export interface LolLootMilestone {
  "id": string;
  "name": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "properties": Record<string, string>;
  "triggers": LolLootTrigger[];
  "triggerRequirement": string;
}
export interface LolLootMilestoneInstance {
  "milestoneId": string;
  "instanceId": string;
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "repeatSequence": number;
  "triggered": boolean;
  "triggeredTimestamp": string;
  "triggers": LolLootTrigger[];
}
export interface LolLootMilestoneLootItemRewardGdsResource {
  "internalName": string;
}
export interface LolLootMilestonesProgressionConfigRepeatGdsResource {
  "name": LolLootMilestonesProgressionGroupRepeatGdsResource;
}
export interface LolLootMilestonesProgressionCounterGdsResource {
  "id": string;
  "name": string;
  "direction": string;
  "startValue": number;
}
export interface LolLootMilestonesProgressionGroupRepeatGdsResource {
  "Count": number;
  "Scope": number;
  "Multiplier": number;
}
export interface LolLootMilestonesRecipeGdsResource {
  "name": string;
}
export interface LolLootPlayerLoot {
  "lootName": string;
  "lootId": string;
  "refId": string;
  "localizedName": string;
  "localizedDescription": string;
  "itemDesc": string;
  "displayCategories": string;
  "rarity": string;
  "tags": string;
  "type": string;
  "asset": string;
  "tilePath": string;
  "splashPath": string;
  "shadowPath": string;
  "upgradeLootName": string;
  "upgradeEssenceName": string;
  "disenchantLootName": string;
  "localizedRecipeTitle": string;
  "localizedRecipeSubtitle": string;
  "itemStatus": LolLootItemOwnershipStatus;
  "parentItemStatus": LolLootItemOwnershipStatus;
  "redeemableStatus": LolLootRedeemableStatus;
  "count": number;
  "rentalGames": number;
  "storeItemId": number;
  "parentStoreItemId": number;
  "value": number;
  "upgradeEssenceValue": number;
  "disenchantValue": number;
  "disenchantRecipeName": string;
  "expiryTime": number;
  "rentalSeconds": number;
  "isNew": boolean;
  "isRental": boolean;
}
export interface LolLootPlayerLootDelta {
  "deltaCount": number;
  "playerLoot": LolLootPlayerLoot;
}
export interface LolLootPlayerLootMap {
  "version": number;
  "playerLoot": Record<string, LolLootPlayerLoot>;
}
export interface LolLootPlayerLootNotification {
  "id": string;
  "count": number;
  "acknowledged": boolean;
}
export interface LolLootPlayerLootUpdate {
  "added": LolLootPlayerLootDelta[];
  "removed": LolLootPlayerLootDelta[];
  "redeemed": LolLootPlayerLootDelta[];
}
export interface LolLootProgressionConfigGdsResource {
  "id": string;
  "name": string;
  "repeat": LolLootMilestonesProgressionConfigRepeatGdsResource;
  "counters": LolLootMilestonesProgressionCounterGdsResource[];
  "milestones": LolLootProgressionConfigMilestoneGdsResource[];
}
export interface LolLootProgressionConfigMilestoneGdsResource {
  "id": string;
  "name": string;
  "triggerValue": number;
  "properties": LolLootProgressionConfigMilestonePropertiesGdsResource[];
  "counter": LolLootMilestonesProgressionCounterGdsResource;
}
export interface LolLootProgressionConfigMilestonePropertiesGdsResource {
  "id": string;
  "name": string;
  "description": string;
  "rewardStrategy": string;
  "rewards": LolLootProgressionConfigMilestoneRewardGdsResource[];
}
export interface LolLootProgressionConfigMilestoneRewardGdsResource {
  "id": string;
  "rewardType": string;
  "quantity": number;
  "lootItemToGrant"?: LolLootMilestoneLootItemRewardGdsResource;
  "legacyLootItem": string;
}
export interface LolLootQueryEvaluatedLootItem {
  "lootName": string;
  "localizedName": string;
}
export interface LolLootRMSPayload {
  "productId": string;
  "affinities": string[];
}
export interface LolLootRecipeMenuConfig {
  "enabled": boolean;
  "lootItemsUsingBreakoutRecipeMenu": string[];
  "alwaysShowLootIds": string[];
}
export interface LolLootRecipeMetadata {
  "guaranteedDescriptions": LolLootLootDescription[];
  "bonusDescriptions": LolLootLootDescription[];
  "tooltipsDisabled": boolean;
}
export interface LolLootRecipeOutput {
  "lootName": string;
  "quantity": number;
}
export interface LolLootRecipeSlot {
  "slotNumber": number;
  "lootIds": string[];
  "tags": string;
  "quantity": number;
}
export interface LolLootRecipeWithMilestones {
  "recipeName": string;
  "type": string;
  "description": string;
  "contextMenuText": string;
  "requirementText": string;
  "imagePath": string;
  "introVideoPath": string;
  "loopVideoPath": string;
  "outroVideoPath": string;
  "displayCategories": string;
  "crafterName": string;
  "slots": LolLootRecipeSlot[];
  "outputs": LolLootRecipeOutput[];
  "metadata": LolLootRecipeMetadata;
  "singleOpen": boolean;
  "hasVisibleLootOdds": boolean;
  "lootMilestoneIds": string[];
}
export type LolLootRedeemableStatus = "ALREADY_OWNED" | "ALREADY_RENTED" | "CHAMPION_NOT_OWNED" | "NOT_REDEEMABLE" | "NOT_REDEEMABLE_RENTAL" | "REDEEMABLE" | "REDEEMABLE_RENTAL" | "SKIN_NOT_OWNED" | "UNKNOWN";
export interface LolLootRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolLootRepeat {
  "count": number;
  "scope": number;
  "multiplier": number;
  "milestones": LolLootMilestone[];
  "repeatTriggers": LolLootRepeatGroupTrigger[];
}
export interface LolLootRepeatGroupTrigger {
  "type": string;
  "counterId": string;
  "startTriggerValue": number;
  "increaseBy": number;
  "multiplier": number;
}
export interface LolLootRequestDTO_SelectionRequestDTO {
  "data": LolLootSelectionRequestDTO;
  "metadata": LolLootRequestMetadataDTO;
}
export interface LolLootRequestDTO_vector_SelectionRequestDTO {
  "data": LolLootSelectionRequestDTO[];
  "metadata": LolLootRequestMetadataDTO;
}
export interface LolLootRequestDTO_vector_string {
  "data": string[];
  "metadata": LolLootRequestMetadataDTO;
}
export interface LolLootRequestMetadataDTO {
  "transactionId"?: string;
}
export interface LolLootResponseDTO_SvcRewardGrant {
  "data": LolLootSvcRewardGrant;
  "metadata": LolLootResponseMetadataDTO;
}
export interface LolLootResponseDTO_map_RewardGroupId_SelectGrantStatus {
  "data": Record<string, LolLootSelectGrantStatusResponse>;
  "metadata": LolLootResponseMetadataDTO;
}
export interface LolLootResponseDTO_vector_SvcRewardGrant {
  "data": LolLootSvcRewardGrant[];
  "metadata": LolLootResponseMetadataDTO;
}
export interface LolLootResponseDTO_vector_SvcRewardGroup {
  "data": LolLootSvcRewardGroup[];
  "metadata": LolLootResponseMetadataDTO;
}
export interface LolLootResponseMetadataDTO {
}
export interface LolLootReward {
  "id": string;
  "itemId": string;
  "itemType": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolLootRewardGrant {
  "info": LolLootSvcRewardGrant;
  "rewardGroup": LolLootSvcRewardGroup;
}
export type LolLootRewardStatus = "FAILED" | "FULFILLED" | "PENDING";
export type LolLootRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolLootRewardsCatalogPluginItem {
  "itemId": number;
  "name": string;
  "itemInstanceId": string;
  "owned": boolean;
  "rarity": string;
  "active": boolean;
  "questSkinInfo": LolLootRewardsSkinLineInfo;
}
export interface LolLootRewardsCatalogPluginItemAssets {
  "splashPath": string;
  "loadScreenPath": string;
}
export interface LolLootRewardsCatalogPluginItemWithDetails {
  "item": LolLootRewardsCatalogPluginItem;
  "assets": LolLootRewardsCatalogPluginItemAssets;
}
export interface LolLootRewardsConfig {
  "GrantFiltering": boolean;
}
export interface LolLootRewardsSkinLineInfo {
  "tiers": LolLootRewardsSkinLineTier[];
  "mostProgressedSkinTier": LolLootRewardsSkinLineTier;
  "productType": string;
}
export interface LolLootRewardsSkinLineTier {
  "stage": number;
  "name": string;
  "uncenteredSplashPath": string;
  "ownership": LolLootRewardsSkinLineTierOwnership;
}
export interface LolLootRewardsSkinLineTierOwnership {
  "owned": boolean;
}
export type LolLootSelectGrantStatusResponse = "FAILED" | "SELECTED";
export interface LolLootSelectionRequestDTO {
  "grantId": string;
  "rewardGroupId": string;
  "selections": string[];
}
export interface LolLootSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolLootSvcRewardGrant {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "dateCreated": string;
  "status": LolLootGrantStatus;
  "grantElements": LolLootSvcRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
  "grantorDescription": LolLootGrantorDescription;
  "messageParameters": Record<string, unknown>;
}
export interface LolLootSvcRewardGrantElement {
  "elementId": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "status": LolLootRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolLootSvcRewardGroup {
  "id": string;
  "productId": string;
  "types": string[];
  "rewards": LolLootReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolLootRewardStrategy;
  "selectionStrategyConfig"?: LolLootSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
  "celebrationType": LolLootCelebrationType;
}
export interface LolLootTFTDamageSkinGroupViewModel {
  "groupName": string;
  "groupId": number;
  "numOwned": number;
  "numAvailable": number;
  "items": LolLootCosmeticsTFTDamageSkinViewModel[];
}
export interface LolLootTFTDamageSkinGroupedViewModel {
  "selectedLoadoutItem": LolLootCosmeticsTFTDamageSkinViewModel;
  "defaultItemId": number;
  "groups": LolLootTFTDamageSkinGroupViewModel[];
}
export interface LolLootTFTMapSkinGroupViewModel {
  "items": LolLootCosmeticsTFTMapSkinViewModel[];
}
export interface LolLootTFTMapSkinGroupedViewModel {
  "selectedLoadoutItem": LolLootCosmeticsTFTMapSkinViewModel;
  "defaultItemId": number;
  "groups": LolLootTFTMapSkinGroupViewModel[];
}
export interface LolLootTrigger {
  "type": string;
  "counterId": string;
  "entitlementItemId": string;
  "triggerValue": number;
}
export interface LolLootVerboseLootOddsResponse {
  "recipeName": string;
  "chanceToContain": LolLootLootOddsResponse[];
  "guaranteedToContain": LolLootLootOddsResponse[];
  "lootItem": LolLootPlayerLoot;
  "hasPityRules": boolean;
  "checksOwnership": boolean;
}
export interface LolLoyaltyAccessToken {
  "token": string;
}
export interface LolLoyaltyGlobalRewards {
  "allChampions": boolean;
}
export interface LolLoyaltyInventoryDTO {
  "items": Record<string, unknown>;
}
export interface LolLoyaltyInventoryItemDTO {
  "inventoryType": string;
  "loyalty": boolean;
}
export interface LolLoyaltyInventoryResponseDTO {
  "data": LolLoyaltyInventoryDTO;
}
export interface LolLoyaltyLoginSession {
  "state": LolLoyaltyLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "puuid": string;
}
export type LolLoyaltyLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolLoyaltyLoyaltyRewards {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "global": LolLoyaltyGlobalRewards;
  "ipBoost": number;
  "xpBoost": Record<string, number>;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export interface LolLoyaltyLoyaltyRewardsSimplified {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "global": LolLoyaltyGlobalRewards;
  "ipBoost": number;
  "xpBoost": number;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export type LolLoyaltyLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolLoyaltyLoyaltyStatusNotification {
  "status": LolLoyaltyLoyaltyStatus;
  "rewards": LolLoyaltyLoyaltyRewardsSimplified;
  "reloadInventory": boolean;
}
export interface LolLoyaltyPlayerNotification {
  "critical": boolean;
  "detailKey": string;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
  "iconUrl": string;
}
export interface LolLoyaltyRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolLoyaltyRmsEntitlementPayload {
  "itemId": string;
  "itemTypeId": string;
  "entitlementTypeId": string;
  "resourceOperation": string;
}
export type LolMacGraphicsUpgradeMacGraphicsUpgradeNotificationType = "HARDWARE_UPGRADE" | "NONE";
export interface LolMapsGameModeSpellList {
  "spells": number[];
}
export interface LolMapsMaps {
  "id": number;
  "isDefault": boolean;
  "gameMode": string;
  "gameModeName": string;
  "gameModeShortName": string;
  "gameModeDescription": string;
  "gameMutator": string;
  "isRGM": boolean;
  "name": string;
  "description": string;
  "mapStringId": string;
  "platformId": string;
  "platformName": string;
  "assets": Record<string, string>;
  "locStrings": Record<string, string>;
  "setModalButtonBottom": number;
  "setModalButtonLeft": number;
  "categorizedContentBundles": unknown;
  "tutorialCards": LolMapsTutorialCard[];
  "properties": unknown;
  "perPositionRequiredSummonerSpells": Record<string, LolMapsGameModeSpellList>;
  "perPositionDisallowedSummonerSpells": Record<string, LolMapsGameModeSpellList>;
  "tftSetOverride": string;
}
export interface LolMapsTutorialCard {
  "header"?: string;
  "footer"?: string;
  "description"?: string;
  "imagePath": string;
}
export interface LolMarketplaceCatalogEntryDto {
  "id": string;
  "productId": string;
  "name": string;
  "description": string;
  "endTime": string;
  "purchaseUnits": LolMarketplacePurchaseUnitDto[];
  "displayMetadata": unknown;
  "refundRule": string;
  "giftRule": string;
  "prerequisites": LolMarketplacePrerequisiteDto[];
  "purchaseLimits": LolMarketplaceVelocityLimitDeltaDto[];
}
export interface LolMarketplaceChemtechShoppeDropsFulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "ownershipCompensationMode": string;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
}
export interface LolMarketplaceChemtechShoppeDropsRollDto {
  "fulfillments": LolMarketplaceChemtechShoppeDropsFulfillmentDto[];
}
export interface LolMarketplaceChemtechShoppeDropsRollResultsDto {
  "rolls": LolMarketplaceChemtechShoppeDropsRollDto[];
}
export interface LolMarketplaceEntitlementDto {
  "id": string;
  "label": string;
  "typeId": string;
  "productId": string;
  "active": boolean;
  "createdDate": string;
  "lastModifiedDate": string;
  "firstUsedDate": string;
  "recipient": unknown;
  "ownerId": string;
  "item": LolMarketplaceEntitlementItemDto;
}
export interface LolMarketplaceEntitlementItemDto {
  "id": string;
  "typeId": string;
}
export interface LolMarketplaceEntitlementsResponse {
  "data": LolMarketplaceEntitlementDto[];
}
export interface LolMarketplaceFinalPurchaseUnitDto {
  "payments": LolMarketplacePaymentDto[];
  "fulfillment": LolMarketplaceFulfillmentDto;
}
export interface LolMarketplaceFulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "ownershipCompensationMode": string;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
  "progressionCounterId": string;
  "dropTableId": string;
  "results": LolMarketplaceChemtechShoppeDropsRollResultsDto;
}
export interface LolMarketplaceGameDataCompanion {
  "contentId": string;
  "companionType": string;
}
export interface LolMarketplacePagination {
  "offset": number;
  "limit": number;
  "maxLimit": number;
  "total": number;
  "previous": string;
  "next": string;
}
export interface LolMarketplacePaymentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "discountedDelta": number;
  "discountPercent": number;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
}
export interface LolMarketplacePaymentOptionDto {
  "key": string;
  "payments": LolMarketplacePaymentDto[];
}
export interface LolMarketplacePrerequisiteDto {
  "status": string;
  "itemTypeId": string;
  "itemId": string;
  "requiredQuantity": number;
}
export interface LolMarketplacePurchaseDto {
  "id": string;
  "productId": string;
  "storeId": string;
  "storeName": string;
  "catalogEntryId": string;
  "catalogEntryName": string;
  "purchaserId": string;
  "recipientId": string;
  "purchaseUnits": LolMarketplaceFinalPurchaseUnitDto[];
  "createdTime": string;
  "completedTime": string;
  "purchaseState": string;
  "purchaseVisibility": string;
  "refund": LolMarketplaceRefundDto;
  "refundRule": string;
  "refundable": boolean;
  "quantity": number;
  "source": string;
}
export interface LolMarketplacePurchaseErrorMessageDto {
  "httpStatus": number;
  "errorCode": string;
  "message": string;
}
export interface LolMarketplacePurchaseHistoryResponse {
  "data": LolMarketplacePurchaseDto[];
  "paging": LolMarketplacePagination;
  "stats": LolMarketplaceResponseStats;
  "notes": string[];
  "errors": LolMarketplaceResponseError[];
}
export interface LolMarketplacePurchaseRequest {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "quantity": number;
}
export interface LolMarketplacePurchaseRequestDto {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "idempotencyId": string;
  "source": string;
  "quantity": number;
}
export interface LolMarketplacePurchaseResponse {
  "data": LolMarketplacePurchaseDto;
  "paging": LolMarketplacePagination;
  "stats": LolMarketplaceResponseStats;
  "notes": string[];
  "errors": LolMarketplaceResponseError[];
}
export interface LolMarketplacePurchaseTransaction {
  "purchaseId": string;
  "productId": string;
  "storeId": string;
  "catalogEntryId": string;
  "purchaseState": string;
  "refundId": string;
  "refundState": string;
}
export interface LolMarketplacePurchaseUnitDto {
  "paymentOptions": LolMarketplacePaymentOptionDto[];
  "payment": LolMarketplacePaymentDto[];
  "fulfillment": LolMarketplaceFulfillmentDto;
}
export interface LolMarketplaceRefundDto {
  "id": string;
  "purchaseId": string;
  "createdTime": string;
  "completedTime": string;
  "state": string;
  "source": string;
}
export interface LolMarketplaceRefundRequest {
  "purchaseId": string;
}
export interface LolMarketplaceRefundRequestDto {
  "purchaseId": string;
  "source": string;
}
export interface LolMarketplaceRefundResponse {
  "data": LolMarketplaceRefundDto;
  "paging": LolMarketplacePagination;
  "stats": LolMarketplaceResponseStats;
  "notes": string[];
  "errors": LolMarketplaceResponseError[];
}
export interface LolMarketplaceRegionLocale {
  "region": string;
  "locale": string;
  "webRegion": string;
}
export interface LolMarketplaceResponseError {
  "message": string;
  "type": string;
  "code": number;
}
export interface LolMarketplaceResponseStats {
  "durationMs": number;
}
export interface LolMarketplaceRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolMarketplaceRotationalShopBundleData {
  "asset": string;
  "description": string;
  "descriptionKey": string;
  "title": string;
  "titleKey": string;
}
export interface LolMarketplaceRotationalShopBundleListData {
  "items": LolMarketplaceRotationalShopBundleData[];
}
export interface LolMarketplaceRotationalShopItemData {
  "backgroundTextureLCU": string;
  "contentID": string;
  "descriptionTraKey": string;
  "description": string;
  "name": string;
  "standaloneLoadoutsLargeIcon": string;
  "videoID": string;
  "redeemIconTexture": string;
  "rarity": string;
  "typeID": string;
  "speciesLink": string;
}
export interface LolMarketplaceStoreDto {
  "id": string;
  "productId": string;
  "name": string;
  "catalogEntries": LolMarketplaceCatalogEntryDto[];
  "displayMetadata": unknown;
  "startTime": string;
  "endTime": string;
}
export interface LolMarketplaceStoresResponse {
  "data": LolMarketplaceStoreDto[];
  "paging": LolMarketplacePagination;
  "stats": LolMarketplaceResponseStats;
  "notes": string[];
  "errors": LolMarketplaceResponseError[];
}
export interface LolMarketplaceTFTRotationalShopConfig {
  "enabled": boolean;
  "contentPreviewConfig": unknown;
  "uiToggleEnabled": boolean;
  "navs": LolMarketplaceTFTRotationalShopNavConfig[];
  "refund": LolMarketplaceTFTRotationalShopRefundConfig;
  "littleLegendsUpgradeEnabled": boolean;
  "eventsStoreEnabled": boolean;
  "eventsStoreData": unknown;
  "eventsMusicDisabled": boolean;
}
export interface LolMarketplaceTFTRotationalShopNavConfig {
  "name": string;
  "enabled": boolean;
  "supportedCurrencies": string[];
}
export interface LolMarketplaceTFTRotationalShopRefundConfig {
  "enabled": boolean;
  "allowedTypes": string[];
  "thresholdDays": number;
}
export interface LolMarketplaceTraKeyName {
  "nameTraKey": string;
  "translatedName": string;
}
export interface LolMarketplaceVelocityLimitDeltaDto {
  "ruleId": string;
  "delta": number;
  "remaining": number;
}
export interface LolMarketplaceVelocityLimiterDto {
  "availableTokens": number;
  "refill": string;
}
export interface LolMatchHistoryAlias {
  "gameName": string;
  "tagLine": string;
}
export interface LolMatchHistoryGAMHSMatchHistoryData {
  "metadata": LolMatchHistoryGAMHSMatchHistoryMetadata;
  "json": unknown;
}
export interface LolMatchHistoryGAMHSMatchHistoryList {
  "games": LolMatchHistoryGAMHSMatchHistoryData[];
  "active_puuid": string;
}
export interface LolMatchHistoryGAMHSMatchHistoryMetadata {
  "product": string;
  "data_version": number;
  "info_type": string;
  "match_id": string;
  "tags": string[];
  "participants": string[];
  "timestamp": number;
  "private": boolean;
}
export interface LolMatchHistoryGameDataChampionSummary {
  "id": number;
  "name": string;
  "alias": string;
}
export interface LolMatchHistoryLoginSession {
  "state": LolMatchHistoryLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
}
export type LolMatchHistoryLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolMatchHistoryMatchHistoryEvent {
  "type": string;
  "timestamp": number;
  "itemId": number;
  "participantId": number;
  "teamId": number;
  "killerId": number;
  "victimId": number;
  "skillSlot": number;
  "position": LolMatchHistoryMatchHistoryPosition;
  "assistingParticipantIds": number[];
  "buildingType": string;
  "laneType": string;
  "towerType": string;
  "monsterType": string;
  "monsterSubType": string;
}
export interface LolMatchHistoryMatchHistoryGame {
  "endOfGameResult": string;
  "gameId": number;
  "platformId": string;
  "gameCreation": number;
  "gameCreationDate": string;
  "gameDuration": number;
  "queueId": number;
  "mapId": number;
  "seasonId": number;
  "gameVersion": string;
  "gameMode": string;
  "gameModeMutators": string[];
  "gameType": string;
  "teams": LolMatchHistoryMatchHistoryTeam[];
  "participants": LolMatchHistoryMatchHistoryParticipant[];
  "participantIdentities": LolMatchHistoryMatchHistoryParticipantIdentities[];
}
export interface LolMatchHistoryMatchHistoryGameList {
  "gameIndexBegin": number;
  "gameIndexEnd": number;
  "gameBeginDate": string;
  "gameEndDate": string;
  "gameCount": number;
  "games": LolMatchHistoryMatchHistoryGame[];
}
export interface LolMatchHistoryMatchHistoryList {
  "platformId": string;
  "accountId": number;
  "games": LolMatchHistoryMatchHistoryGameList;
}
export interface LolMatchHistoryMatchHistoryParticipant {
  "participantId": number;
  "teamId": number;
  "championId": number;
  "spell1Id": number;
  "spell2Id": number;
  "highestAchievedSeasonTier": string;
  "stats": LolMatchHistoryMatchHistoryParticipantStatistics;
  "timeline": LolMatchHistoryMatchHistoryTimeline;
}
export interface LolMatchHistoryMatchHistoryParticipantFrame {
  "participantId": number;
  "position": LolMatchHistoryMatchHistoryPosition;
  "currentGold": number;
  "totalGold": number;
  "level": number;
  "xp": number;
  "minionsKilled": number;
  "jungleMinionsKilled": number;
  "dominionScore": number;
  "teamScore": number;
}
export interface LolMatchHistoryMatchHistoryParticipantIdentities {
  "participantId": number;
  "player": LolMatchHistoryMatchHistoryParticipantIdentityPlayer;
}
export interface LolMatchHistoryMatchHistoryParticipantIdentityPlayer {
  "puuid": string;
  "platformId": string;
  "accountId": number;
  "summonerId": number;
  "summonerName": string;
  "gameName": string;
  "tagLine": string;
  "currentPlatformId": string;
  "currentAccountId": number;
  "matchHistoryUri": string;
  "profileIcon": number;
}
export interface LolMatchHistoryMatchHistoryParticipantStatistics {
  "participantId": number;
  "win": boolean;
  "item0": number;
  "item1": number;
  "item2": number;
  "item3": number;
  "item4": number;
  "item5": number;
  "item6": number;
  "kills": number;
  "deaths": number;
  "assists": number;
  "largestKillingSpree": number;
  "largestMultiKill": number;
  "killingSprees": number;
  "longestTimeSpentLiving": number;
  "doubleKills": number;
  "tripleKills": number;
  "quadraKills": number;
  "pentaKills": number;
  "unrealKills": number;
  "totalDamageDealt": number;
  "magicDamageDealt": number;
  "physicalDamageDealt": number;
  "trueDamageDealt": number;
  "largestCriticalStrike": number;
  "totalDamageDealtToChampions": number;
  "magicDamageDealtToChampions": number;
  "physicalDamageDealtToChampions": number;
  "trueDamageDealtToChampions": number;
  "totalHeal": number;
  "totalUnitsHealed": number;
  "totalDamageTaken": number;
  "magicalDamageTaken": number;
  "physicalDamageTaken": number;
  "trueDamageTaken": number;
  "goldEarned": number;
  "goldSpent": number;
  "turretKills": number;
  "inhibitorKills": number;
  "totalMinionsKilled": number;
  "neutralMinionsKilled": number;
  "neutralMinionsKilledTeamJungle": number;
  "neutralMinionsKilledEnemyJungle": number;
  "totalTimeCrowdControlDealt": number;
  "champLevel": number;
  "visionWardsBoughtInGame": number;
  "sightWardsBoughtInGame": number;
  "wardsPlaced": number;
  "wardsKilled": number;
  "firstBloodKill": boolean;
  "firstBloodAssist": boolean;
  "firstTowerKill": boolean;
  "firstTowerAssist": boolean;
  "firstInhibitorKill": boolean;
  "firstInhibitorAssist": boolean;
  "gameEndedInEarlySurrender": boolean;
  "gameEndedInSurrender": boolean;
  "causedEarlySurrender": boolean;
  "earlySurrenderAccomplice": boolean;
  "teamEarlySurrendered": boolean;
  "gameEndedInIGNBSurrender": boolean;
  "causedGameEndFromIGNBSurrender": boolean;
  "wasSevereTransgressor": boolean;
  "combatPlayerScore": number;
  "objectivePlayerScore": number;
  "totalPlayerScore": number;
  "totalScoreRank": number;
  "damageSelfMitigated": number;
  "damageDealtToObjectives": number;
  "damageDealtToTurrets": number;
  "visionScore": number;
  "timeCCingOthers": number;
  "playerScore0": number;
  "playerScore1": number;
  "playerScore2": number;
  "playerScore3": number;
  "playerScore4": number;
  "playerScore5": number;
  "playerScore6": number;
  "playerScore7": number;
  "playerScore8": number;
  "playerScore9": number;
  "perkPrimaryStyle": number;
  "perkSubStyle": number;
  "perk0": number;
  "perk0Var1": number;
  "perk0Var2": number;
  "perk0Var3": number;
  "perk1": number;
  "perk1Var1": number;
  "perk1Var2": number;
  "perk1Var3": number;
  "perk2": number;
  "perk2Var1": number;
  "perk2Var2": number;
  "perk2Var3": number;
  "perk3": number;
  "perk3Var1": number;
  "perk3Var2": number;
  "perk3Var3": number;
  "perk4": number;
  "perk4Var1": number;
  "perk4Var2": number;
  "perk4Var3": number;
  "perk5": number;
  "perk5Var1": number;
  "perk5Var2": number;
  "perk5Var3": number;
  "playerAugment1": number;
  "playerAugment2": number;
  "playerAugment3": number;
  "playerAugment4": number;
  "playerAugment5": number;
  "playerAugment6": number;
  "playerSubteamId": number;
  "subteamPlacement": number;
  "roleBoundItem": number;
}
export interface LolMatchHistoryMatchHistoryPosition {
  "x": number;
  "y": number;
}
export interface LolMatchHistoryMatchHistoryTeam {
  "teamId": number;
  "win": string;
  "firstBlood": boolean;
  "firstTower": boolean;
  "firstInhibitor": boolean;
  "firstBaron": boolean;
  "firstDargon": boolean;
  "towerKills": number;
  "inhibitorKills": number;
  "baronKills": number;
  "dragonKills": number;
  "vilemawKills": number;
  "riftHeraldKills": number;
  "hordeKills": number;
  "dominionVictoryScore": number;
  "bans": LolMatchHistoryMatchHistoryTeamBan[];
}
export interface LolMatchHistoryMatchHistoryTeamBan {
  "championId": number;
  "pickTurn": number;
}
export interface LolMatchHistoryMatchHistoryTimeline {
  "participantId": number;
  "role": string;
  "lane": string;
  "creepsPerMinDeltas": Record<string, number>;
  "xpPerMinDeltas": Record<string, number>;
  "goldPerMinDeltas": Record<string, number>;
  "csDiffPerMinDeltas": Record<string, number>;
  "xpDiffPerMinDeltas": Record<string, number>;
  "damageTakenPerMinDeltas": Record<string, number>;
  "damageTakenDiffPerMinDeltas": Record<string, number>;
}
export interface LolMatchHistoryMatchHistoryTimelineFrame {
  "participantFrames": Record<string, LolMatchHistoryMatchHistoryParticipantFrame>;
  "events": LolMatchHistoryMatchHistoryEvent[];
  "timestamp": number;
}
export interface LolMatchHistoryMatchHistoryTimelineFrames {
  "frames": LolMatchHistoryMatchHistoryTimelineFrame[];
}
export interface LolMatchHistoryRecentlyPlayedSummoner {
  "summonerId": number;
  "summonerName": string;
  "gameName": string;
  "tagLine": string;
  "gameId": number;
  "gameCreationDate": string;
  "championId": number;
  "teamId": number;
  "puuid": string;
}
export interface LolMatchHistorySummoner {
  "summonerId": number;
  "accountId": number;
  "displayName": string;
  "gameName": string;
  "tagLine": string;
  "puuid": string;
}
export interface LolMatchmakingGameflowGameData {
  "queue": LolMatchmakingGameflowQueue;
}
export interface LolMatchmakingGameflowGameDodge {
  "state": LolMatchmakingMatchmakingDodgeState;
  "dodgeIds": number[];
}
export interface LolMatchmakingGameflowGameTypeConfig {
  "reroll": boolean;
}
export type LolMatchmakingGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolMatchmakingGameflowQueue {
  "gameTypeConfig": LolMatchmakingGameflowGameTypeConfig;
}
export interface LolMatchmakingGameflowSession {
  "phase": LolMatchmakingGameflowPhase;
  "gameData": LolMatchmakingGameflowGameData;
  "gameDodge": LolMatchmakingGameflowGameDodge;
}
export interface LolMatchmakingLcdsConnection {
  "stableConnection": boolean;
}
export interface LolMatchmakingLobbyStatus {
  "queueId": number;
  "isCustom": boolean;
  "isLeader": boolean;
  "isSpectator": boolean;
  "allowedPlayAgain": boolean;
  "memberSummonerIds": number[];
  "lobbyId"?: string;
  "customSpectatorPolicy": LolMatchmakingQueueCustomGameSpectatorPolicy;
}
export interface LolMatchmakingLoginSession {
  "state": LolMatchmakingLoginSessionState;
  "summonerId": number;
  "accountId": number;
  "connected": boolean;
}
export type LolMatchmakingLoginSessionState = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolMatchmakingMatchmakingDodgeData {
  "state": LolMatchmakingMatchmakingDodgeState;
  "dodgerId": number;
}
export type LolMatchmakingMatchmakingDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
export type LolMatchmakingMatchmakingDodgeWarning = "ConnectionWarning" | "None" | "Penalty" | "Warning";
export interface LolMatchmakingMatchmakingLowPriorityData {
  "penalizedSummonerIds": number[];
  "penaltyTime": number;
  "penaltyTimeRemaining": number;
  "bustedLeaverAccessToken": string;
  "reason": string;
}
export interface LolMatchmakingMatchmakingReadyCheckResource {
  "state": LolMatchmakingMatchmakingReadyCheckState;
  "playerResponse": LolMatchmakingMatchmakingReadyCheckResponse;
  "dodgeWarning": LolMatchmakingMatchmakingDodgeWarning;
  "timer": number;
  "declinerIds": number[];
  "suppressUx": boolean;
}
export type LolMatchmakingMatchmakingReadyCheckResponse = "Accepted" | "Declined" | "None";
export type LolMatchmakingMatchmakingReadyCheckState = "Error" | "EveryoneReady" | "InProgress" | "Invalid" | "PartyNotReady" | "StrangerNotReady";
export interface LolMatchmakingMatchmakingSearchErrorResource {
  "id": number;
  "errorType": string;
  "penalizedSummonerId": number;
  "penaltyTimeRemaining": number;
  "message": string;
}
export interface LolMatchmakingMatchmakingSearchResource {
  "queueId": number;
  "isCurrentlyInQueue": boolean;
  "lobbyId": string;
  "searchState": LolMatchmakingMatchmakingSearchState;
  "timeInQueue": number;
  "estimatedQueueTime": number;
  "readyCheck": LolMatchmakingMatchmakingReadyCheckResource;
  "dodgeData": LolMatchmakingMatchmakingDodgeData;
  "lowPriorityData": LolMatchmakingMatchmakingLowPriorityData;
  "errors": LolMatchmakingMatchmakingSearchErrorResource[];
}
export type LolMatchmakingMatchmakingSearchState = "AbandonedLowPriorityQueue" | "Canceled" | "Error" | "Found" | "Invalid" | "Searching" | "ServiceError" | "ServiceShutdown";
export interface LolMatchmakingPlayerStatus {
  "currentLobbyStatus"?: LolMatchmakingLobbyStatus;
  "lastQueuedLobbyStatus"?: LolMatchmakingLobbyStatus;
}
export interface LolMatchmakingQueue {
  "id": number;
  "isTeamBuilderManaged": boolean;
}
export type LolMatchmakingQueueCustomGameSpectatorPolicy = "AllAllowed" | "FriendsAllowed" | "LobbyAllowed" | "NotAllowed";
export interface LolMissionsCAPMission {
  "missionId": string;
  "title": string;
  "description": string;
  "missionIconAsset": LolMissionsMissionAsset;
  "rewards": LolMissionsCAPMissionReward[];
  "objectives": LolMissionsCAPMissionObjective[];
}
export interface LolMissionsCAPMissionCollection {
  "missionCollectionId": string;
  "dates": LolMissionsCAPMissionCollectionDates;
  "seriesList": LolMissionsCAPMissionSeries[];
}
export interface LolMissionsCAPMissionCollectionDateRange {
  "activationTimeEpoch": number;
  "deactivationTimeEpoch": number;
}
export interface LolMissionsCAPMissionCollectionDates {
  "live": LolMissionsCAPMissionCollectionDateRange;
  "pbe": LolMissionsCAPMissionCollectionDateRange;
  "internal": LolMissionsCAPMissionCollectionDateRange;
}
export interface LolMissionsCAPMissionObjective {
  "statId": string;
  "description": string;
}
export interface LolMissionsCAPMissionReward {
  "itemId": string;
  "rewardName": string;
  "quantity": number;
  "rewardAsset": LolMissionsMissionAsset;
}
export interface LolMissionsCAPMissionSeries {
  "seriesId": string;
  "seriesTitle": string;
  "seriesBackgroundImageUrl": string;
  "seriesIconAsset": LolMissionsMissionAsset;
  "missions": LolMissionsCAPMission[];
}
export interface LolMissionsCapMissionSeries {
  "name": string;
  "configurationId": string;
  "missions": LolMissionsCapMissionSeriesMission[];
}
export interface LolMissionsCapMissionSeriesMission {
  "name": string;
  "missionId": string;
  "expression": string;
  "missionCollectionId": string;
  "status": string;
  "completedTimeUtc": string;
  "missionInstanceId": string;
  "objectives": LolMissionsCapMissionSeriesMissionObjective[];
  "eligibility": LolMissionsCapMissionSeriesMissionEligibility[];
  "rewardsStatus": LolMissionsCapMissionSeriesMissionRewardsStatus;
  "repeatSequence": number;
  "properties": Record<string, string>;
  "metadata": Record<string, string>;
}
export interface LolMissionsCapMissionSeriesMissionEligibility {
  "type": string;
  "missionCollectionId": string;
  "missionId": string;
  "startTime": string;
}
export interface LolMissionsCapMissionSeriesMissionObjective {
  "statId": string;
  "objectiveId": string;
  "goal": number;
  "currentValue": number;
}
export interface LolMissionsCapMissionSeriesMissionReward {
  "type": string;
  "counterId": string;
  "itemId": string;
  "itemTypeId": string;
  "typeId": string;
  "currencyId": string;
  "amount": number;
  "quantity": number;
}
export interface LolMissionsCapMissionSeriesMissionRewardsStatus {
  "requiresClaim": boolean;
  "status": string;
  "rewards": LolMissionsCapMissionSeriesMissionReward[];
}
export interface LolMissionsCapMissionsMarkAsViewedPostBody {
  "events": LolMissionsCapMissionsMarkAsViewedPostBodyEvent[];
}
export interface LolMissionsCapMissionsMarkAsViewedPostBodyEvent {
  "configurationId": string;
  "missions": LolMissionsCapMissionsMarkAsViewedPostBodyMission[];
}
export interface LolMissionsCapMissionsMarkAsViewedPostBodyMission {
  "missionInstanceId": string;
  "metadata": Record<string, string>;
}
export interface LolMissionsCapMissionsMeResponse {
  "productId": string;
  "ownerId": string;
  "series": LolMissionsCapMissionSeries[];
}
export interface LolMissionsCollectionsChampion {
  "id": number;
  "freeToPlay": boolean;
  "ownership": LolMissionsCollectionsOwnership;
  "skins": LolMissionsCollectionsChampionSkin[];
}
export interface LolMissionsCollectionsChampionSkin {
  "championId": number;
  "id": number;
  "ownership": LolMissionsCollectionsOwnership;
}
export interface LolMissionsCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolMissionsCollectionsRental;
}
export interface LolMissionsCollectionsRental {
  "rented": boolean;
}
export interface LolMissionsCollectionsSummoner {
  "summonerLevel": number;
}
export interface LolMissionsCollectionsSummonerIcons {
  "icons": number[];
}
export interface LolMissionsCollectionsWardSkin {
  "id": number;
  "ownership": LolMissionsCollectionsOwnership;
}
export type LolMissionsGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolMissionsGameflowSession {
  "phase": LolMissionsGameflowPhase;
}
export type LolMissionsGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolMissionsInventoryItemWithPayload {
  "itemId": number;
}
export interface LolMissionsKiwiHubConfiguration {
  "missionsSeries": LolMissionsCAPMissionSeries;
}
export interface LolMissionsLoginSession {
  "accountId": number;
  "summonerId": number;
  "puuid": string;
  "platformId": string;
}
export type LolMissionsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export type LolMissionsLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolMissionsLoyaltyStatusNotification {
  "status": LolMissionsLoyaltyStatus;
}
export interface LolMissionsMissionAsset {
  "internalName": string;
  "path": string;
  "iconNeedsFrame": boolean;
}
export interface LolMissionsMissionsNotificationResource {
  "backgroundUrl": string;
  "created": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolMissionsMissionsSettingsDataResource {
  "selected_series": string;
}
export interface LolMissionsPlayerUpdateResponse {
  "playerMissions": PlayerMissionDTO[];
  "playerSeries": SeriesDTO[];
}
export interface LolMissionsPluginRegionLocaleChangedEvent {
  "locale": string;
}
export interface LolMissionsRewardGrant {
  "info": LolMissionsRewardGrantInfo;
  "rewardGroup": LolMissionsRewardGroup;
}
export interface LolMissionsRewardGrantElement {
  "id": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "rewardStatus": LolMissionsRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolMissionsRewardGrantInfo {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "status": LolMissionsGrantStatus;
  "grantElements": LolMissionsRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
}
export interface LolMissionsRewardGroup {
  "id": string;
  "internalName": string;
  "productId": string;
  "types": string[];
  "rewards": LolMissionsSvcReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolMissionsRewardStrategy;
  "selectionStrategyConfig": LolMissionsSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolMissionsRewardGroupsSelection {
  "rewardGroups": string[];
}
export type LolMissionsRewardStatus = "FULFILLED" | "PENDING";
export type LolMissionsRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolMissionsRewardsProductConfig {
  "enabled": boolean;
  "serviceUrl": string;
}
export interface LolMissionsRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolMissionsRiotMessagingServicePayload {
  "deltaEventId": string;
  "ownerId": string;
  "updatedMissions": string[];
}
export interface LolMissionsSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolMissionsSeriesOpt {
  "seriesId": string;
  "option": string;
}
export interface LolMissionsSvcReward {
  "id": string;
  "itemId": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolMissionsTftOrb {
  "missionId": string;
  "status": string;
  "unlockTime": number;
  "rewardLevel": number;
  "rewards": PlayerMissionRewardDTO[];
}
export interface LolMissionsTftWeeklyMissions {
  "missions": PlayerMissionDTO[];
}
export interface LolMissionsUserInfo {
  "userInfo": string;
}
export interface LolNpeRewardsAccountSettingsData {
  "login": LolNpeRewardsLoginSeriesSettings;
  "challenges": LolNpeRewardsChallengesSettings;
}
export interface LolNpeRewardsAccountSettingsPayload {
  "data": LolNpeRewardsAccountSettingsData;
  "schemaVersion": number;
}
export interface LolNpeRewardsAllRewards {
  "level": LolNpeRewardsRewardSeries;
  "login": LolNpeRewardsRewardSeries;
}
export interface LolNpeRewardsChallengesProgress {
  "progress": LolNpeRewardsProgress;
}
export interface LolNpeRewardsChallengesSettings {
  "allMissionsCompleted": boolean;
  "totalCount": number;
}
export interface LolNpeRewardsCoopAiRoutingExperiment {
  "enabled": boolean;
  "routingData": LolNpeRewardsRoutingData[];
}
export interface LolNpeRewardsLoginSeriesSettings {
  "allRewardsClaimed": boolean;
  "lastCompletedMissionInternalName": string;
  "lastCompletedMissionDate": number;
}
export interface LolNpeRewardsMission {
  "completedDate": number;
  "status": string;
  "seriesName": string;
  "internalName": string;
  "metadata": LolNpeRewardsMissionsRewardPackMetaData;
  "display": LolNpeRewardsMissionDisplay;
  "objectives": LolNpeRewardsObjective[];
}
export interface LolNpeRewardsMissionDisplay {
  "locations": string[];
}
export interface LolNpeRewardsMissionSeries {
  "internalName": string;
  "status": string;
  "id": string;
}
export interface LolNpeRewardsMissionSeriesOptIn {
  "seriesId": string;
  "option": string;
}
export interface LolNpeRewardsMissionsRewardPackMetaData {
  "npeRewardPack": LolNpeRewardsRewardPack;
}
export interface LolNpeRewardsObjective {
  "progress": LolNpeRewardsProgress;
}
export interface LolNpeRewardsPoroExperimentData {
  "coopAiRoutingExperiment": LolNpeRewardsCoopAiRoutingExperiment;
  "summonerLevel": number;
}
export interface LolNpeRewardsPoroExperimentPlayerSettingsData {
  "coopAiRoutingEnabled": string;
}
export interface LolNpeRewardsProgress {
  "lastViewedProgress": number;
  "currentProgress": number;
  "totalCount": number;
}
export interface LolNpeRewardsRequirements {
  "level": number;
  "day": number;
  "missionInternalName": string;
}
export interface LolNpeRewardsReward {
  "renderer": string;
  "data": unknown;
}
export interface LolNpeRewardsRewardPack {
  "index": number;
  "type": string;
  "requirements": LolNpeRewardsRequirements;
  "state": string;
  "premiumReward": boolean;
  "rewardKey": string;
  "majorReward": LolNpeRewardsReward;
  "minorRewards": LolNpeRewardsReward[];
  "delay": number;
  "unlockTime": number;
}
export interface LolNpeRewardsRewardSeries {
  "rewardPacks": LolNpeRewardsRewardPack[];
}
export interface LolNpeRewardsRewardSeriesState {
  "allRewardsClaimed": boolean;
}
export interface LolNpeRewardsRoutingData {
  "queueId": number;
  "minLevel": number;
  "maxLevel": number;
}
export interface LolNpeRewardsSettingsPoroExperimentResource {
  "schemaVersion": number;
  "data": LolNpeRewardsPoroExperimentPlayerSettingsData;
}
export interface LolNpeRewardsSummoner {
  "summonerLevel": number;
  "puuid": string;
}
export interface LolNpeTutorialPathAccountSettingsCategoryResource {
  "data"?: LolNpeTutorialPathAccountSettingsTutorial;
  "schemaVersion": number;
}
export interface LolNpeTutorialPathAccountSettingsTutorial {
  "hasSeenTutorialPath": boolean;
  "hasSkippedTutorialPath": boolean;
  "shouldSeeNewPlayerExperience": boolean;
}
export interface LolNpeTutorialPathCollectionsChampion {
  "alias": string;
  "banVoPath": string;
  "chooseVoPath": string;
  "id": number;
  "name": string;
  "roles": string[];
  "squarePortraitPath": string;
  "stingerSfxPath": string;
  "passive": LolNpeTutorialPathCollectionsChampionSpell;
  "spells": LolNpeTutorialPathCollectionsChampionSpell[];
}
export interface LolNpeTutorialPathCollectionsChampionSpell {
  "name": string;
  "description": string;
}
export interface LolNpeTutorialPathExpiringWarning {
  "type": string;
  "message": string;
  "alertTime": number;
}
export type LolNpeTutorialPathGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolNpeTutorialPathGameflowSession {
  "phase": LolNpeTutorialPathGameflowPhase;
}
export interface LolNpeTutorialPathIds {
  "missionIds": string[];
  "seriesIds": string[];
}
export interface LolNpeTutorialPathLobbyChangeQueue {
  "queueId": number;
  "isCustom": boolean;
}
export interface LolNpeTutorialPathLobbyDto {
  "partyId": string;
  "gameConfig": LolNpeTutorialPathLobbyGameConfigDto;
}
export interface LolNpeTutorialPathLobbyGameConfigDto {
  "queueId": number;
}
export interface LolNpeTutorialPathMission {
  "id": string;
  "title": string;
  "helperText": string;
  "description": string;
  "missionLineText": string;
  "backgroundImageUrl": string;
  "iconImageUrl": string;
  "seriesName": string;
  "locale": string;
  "sequence": number;
  "metadata": LolNpeTutorialPathMissionMetadata;
  "startTime": number;
  "endTime": number;
  "lastUpdatedTimestamp": number;
  "objectives": LolNpeTutorialPathObjective[];
  "rewards": LolNpeTutorialPathReward[];
  "expiringWarnings": LolNpeTutorialPathExpiringWarning[];
  "requirements": string[];
  "rewardStrategy": LolNpeTutorialPathRewardStrategy;
  "display": LolNpeTutorialPathMissionDisplay;
  "completionExpression": string;
  "viewed": boolean;
  "isNew": boolean;
  "status": string;
  "missionType": string;
  "displayType": string;
  "earnedDate": number;
  "completedDate": number;
  "cooldownTimeMillis": number;
  "celebrationType": string;
  "clientNotifyLevel": string;
  "internalName": string;
  "media": Record<string, string>;
}
export interface LolNpeTutorialPathMissionDisplay {
  "attributes": string[];
  "locations": string[];
}
export interface LolNpeTutorialPathMissionMetadata {
  "tutorial": LolNpeTutorialPathTutorialMetadata;
  "npeRewardPack": LolNpeTutorialPathNpeRewardPackMetadata;
  "missionType": string;
  "weekNum": number;
  "xpReward": number;
  "chain": number;
  "order": number;
  "chainSize": number;
}
export interface LolNpeTutorialPathNpeReward {
  "renderer": string;
  "data": unknown;
}
export interface LolNpeTutorialPathNpeRewardPackMetadata {
  "index": number;
  "premiumReward": boolean;
  "rewardKey": string;
  "majorReward": LolNpeTutorialPathNpeReward;
  "minorRewards": LolNpeTutorialPathNpeReward[];
}
export interface LolNpeTutorialPathObjective {
  "type": string;
  "description": string;
  "progress": LolNpeTutorialPathProgress;
  "sequence": number;
  "rewardGroups": string[];
  "hasObjectiveBasedReward": boolean;
  "status": string;
  "requirements": string[];
}
export interface LolNpeTutorialPathProgress {
  "lastViewedProgress": number;
  "currentProgress": number;
  "totalCount": number;
}
export interface LolNpeTutorialPathRequirement {
  "expression": string;
}
export interface LolNpeTutorialPathReward {
  "rewardType": string;
  "rewardGroup": string;
  "description": string;
  "iconUrl": string;
  "smallIconUrl": string;
  "itemId": string;
  "uniqueName": string;
  "rewardFulfilled": boolean;
  "rewardGroupSelected": boolean;
  "sequence": number;
  "quantity": number;
  "isObjectiveBasedReward": boolean;
  "media": Record<string, string>;
  "iconNeedsFrame": boolean;
}
export interface LolNpeTutorialPathRewardStrategy {
  "groupStrategy": string;
  "selectMaxGroupCount": number;
  "selectMinGroupCount": number;
}
export interface LolNpeTutorialPathSeries {
  "id": string;
  "internalName": string;
  "status": string;
}
export interface LolNpeTutorialPathSeriesOpt {
  "seriesId": string;
  "option": string;
}
export interface LolNpeTutorialPathSummoner {
  "summonerId": number;
  "accountId": number;
  "displayName": string;
  "profileIconId": number;
  "summonerLevel": number;
  "xpSinceLastLevel": number;
  "xpUntilNextLevel": number;
  "percentCompleteForNextLevel": number;
  "nameChangeFlag": boolean;
  "unnamed": boolean;
}
export interface LolNpeTutorialPathSummonerIcon {
  "profileIconId": number;
}
export interface LolNpeTutorialPathTutorial {
  "id": string;
  "stepNumber": number;
  "title": string;
  "description": string;
  "backgroundUrl": string;
  "queueId": string;
  "useQuickSearchMatchmaking": boolean;
  "useChosenChampion": boolean;
  "status": LolNpeTutorialPathTutorialStatus;
  "isViewed": boolean;
  "type": LolNpeTutorialPathTutorialType;
  "rewards": LolNpeTutorialPathTutorialReward[];
}
export interface LolNpeTutorialPathTutorialMetadata {
  "stepNumber": number;
  "queueId": string;
  "displayRewards": Record<string, string>;
  "useQuickSearchMatchmaking": boolean;
  "useChosenChampion": boolean;
}
export interface LolNpeTutorialPathTutorialReward {
  "rewardType": string;
  "description": string;
  "rewardFulfilled": boolean;
  "iconUrl": string;
  "itemId": string;
  "sequence": number;
  "uniqueName": string;
}
export type LolNpeTutorialPathTutorialStatus = "COMPLETED" | "LOCKED" | "UNLOCKED";
export type LolNpeTutorialPathTutorialType = "CARD" | "REWARD";
export interface LolObjectivesActiveEventUIData {
  "eventId": string;
  "eventInfo": LolObjectivesEventInfoUIData;
}
export interface LolObjectivesCAPMission {
  "missionId": string;
  "title": string;
  "description": string;
  "missionIconAsset": LolObjectivesMissionAsset;
  "rewards": LolObjectivesCAPMissionReward[];
  "objectives": LolObjectivesCAPMissionObjective[];
}
export interface LolObjectivesCAPMissionCollection {
  "missionCollectionId": string;
  "dates": LolObjectivesCAPMissionCollectionDates;
  "seriesList": LolObjectivesCAPMissionSeries[];
}
export interface LolObjectivesCAPMissionCollectionDateRange {
  "activationTimeEpoch": number;
  "deactivationTimeEpoch": number;
}
export interface LolObjectivesCAPMissionCollectionDates {
  "live": LolObjectivesCAPMissionCollectionDateRange;
  "pbe": LolObjectivesCAPMissionCollectionDateRange;
  "internal": LolObjectivesCAPMissionCollectionDateRange;
}
export interface LolObjectivesCAPMissionObjective {
  "statId": string;
  "description": string;
}
export interface LolObjectivesCAPMissionReward {
  "itemId": string;
  "rewardName": string;
  "quantity": number;
  "rewardAsset": LolObjectivesMissionAsset;
}
export interface LolObjectivesCAPMissionSeries {
  "seriesId": string;
  "seriesTitle": string;
  "seriesBackgroundImageUrl": string;
  "seriesIconAsset": LolObjectivesMissionAsset;
  "missions": LolObjectivesCAPMission[];
}
export interface LolObjectivesCapMissionSeries {
  "name": string;
  "configurationId": string;
  "missions": LolObjectivesCapMissionSeriesMission[];
}
export interface LolObjectivesCapMissionSeriesMission {
  "name": string;
  "missionId": string;
  "expression": string;
  "missionCollectionId": string;
  "status": string;
  "completedTimeUtc": string;
  "missionInstanceId": string;
  "objectives": LolObjectivesCapMissionSeriesMissionObjective[];
  "eligibility": LolObjectivesCapMissionSeriesMissionEligibility[];
  "rewardsStatus": LolObjectivesCapMissionSeriesMissionRewardsStatus;
  "repeatSequence": number;
  "properties": Record<string, string>;
  "metadata": Record<string, string>;
}
export interface LolObjectivesCapMissionSeriesMissionEligibility {
  "type": string;
  "missionCollectionId": string;
  "missionId": string;
  "startTime": string;
}
export interface LolObjectivesCapMissionSeriesMissionObjective {
  "statId": string;
  "objectiveId": string;
  "goal": number;
  "currentValue": number;
}
export interface LolObjectivesCapMissionSeriesMissionReward {
  "type": string;
  "counterId": string;
  "itemId": string;
  "itemTypeId": string;
  "typeId": string;
  "currencyId": string;
  "amount": number;
  "quantity": number;
}
export interface LolObjectivesCapMissionSeriesMissionRewardsStatus {
  "requiresClaim": boolean;
  "status": string;
  "rewards": LolObjectivesCapMissionSeriesMissionReward[];
}
export interface LolObjectivesCapMissionsMarkAsViewedPostBody {
  "events": LolObjectivesCapMissionsMarkAsViewedPostBodyEvent[];
}
export interface LolObjectivesCapMissionsMarkAsViewedPostBodyEvent {
  "configurationId": string;
  "missions": LolObjectivesCapMissionsMarkAsViewedPostBodyMission[];
}
export interface LolObjectivesCapMissionsMarkAsViewedPostBodyMission {
  "missionInstanceId": string;
  "metadata": Record<string, string>;
}
export interface LolObjectivesCapMissionsMeResponse {
  "productId": string;
  "ownerId": string;
  "series": LolObjectivesCapMissionSeries[];
}
export interface LolObjectivesCatalogEntry {
  "contentId": string;
  "itemId": number;
  "offerId": string;
  "typeId": string;
}
export interface LolObjectivesCollectionsChampion {
  "id": number;
  "freeToPlay": boolean;
  "ownership": LolObjectivesCollectionsOwnership;
  "skins": LolObjectivesCollectionsChampionSkin[];
}
export interface LolObjectivesCollectionsChampionSkin {
  "championId": number;
  "id": number;
  "ownership": LolObjectivesCollectionsOwnership;
}
export interface LolObjectivesCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolObjectivesCollectionsRental;
}
export interface LolObjectivesCollectionsRental {
  "rented": boolean;
}
export interface LolObjectivesCollectionsSummoner {
  "summonerLevel": number;
}
export interface LolObjectivesCollectionsSummonerIcons {
  "icons": number[];
}
export interface LolObjectivesCollectionsWardSkin {
  "id": number;
  "ownership": LolObjectivesCollectionsOwnership;
}
export type LolObjectivesEventHubType = "ACTIVITY_CENTER_MILESTONES" | "DEMACIA_PASS" | "EVENT_SHOP" | "HALL_OF_LEGENDS" | "NON_PASS" | "SEASON_PASS";
export interface LolObjectivesEventInfoUIData {
  "eventId": string;
  "eventName": string;
  "eventType": string;
  "eventIcon": string;
  "navBarIcon": string;
  "eventTokenImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "currentTokenBalance": number;
  "lockedTokenCount": number;
  "unclaimedRewardCount": number;
  "timeOfLastUnclaimedReward": number;
  "isPassPurchased": boolean;
  "eventPassBundles": LolObjectivesCatalogEntry[];
  "tokenBundles": LolObjectivesCatalogEntry[];
}
export type LolObjectivesGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolObjectivesGameflowSession {
  "phase": LolObjectivesGameflowPhase;
}
export type LolObjectivesGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolObjectivesInventoryItemWithPayload {
  "itemId": number;
}
export interface LolObjectivesKiwiHubConfiguration {
  "missionsSeries": LolObjectivesCAPMissionSeries;
}
export interface LolObjectivesLoginSession {
  "accountId": number;
  "summonerId": number;
  "puuid": string;
  "platformId": string;
}
export type LolObjectivesLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export type LolObjectivesLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolObjectivesLoyaltyStatusNotification {
  "status": LolObjectivesLoyaltyStatus;
}
export interface LolObjectivesMissionAsset {
  "internalName": string;
  "path": string;
  "iconNeedsFrame": boolean;
}
export interface LolObjectivesMissionsNotificationResource {
  "backgroundUrl": string;
  "created": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolObjectivesMissionsSettingsDataResource {
  "selected_series": string;
}
export interface LolObjectivesNonPooledObjectives {
  "id": string;
  "tag": string[];
  "localizedTag": string;
  "objectivesType": string;
  "startDate": number;
  "endDate": number;
  "priority": number;
  "backgroundImage": string;
  "isEnabled": boolean;
  "localizedTitle": string;
  "localizedDescription": string;
}
export type LolObjectivesObjectiveCategoryFilter = "kNPE" | "kNone";
export type LolObjectivesObjectiveCategoryType = "kEventHubConfiguration" | "kNonPass" | "kTFTPassData";
export interface LolObjectivesObjectivesContainer {
  "pooledObjectives": LolObjectivesPooledObjectives[];
  "nonPooledObjectives": LolObjectivesNonPooledObjectives[];
}
export interface LolObjectivesObjectivesGroup {
  "gameType": string;
}
export interface LolObjectivesObjectivesHub {
  "objectivesGroup": LolObjectivesObjectivesGroup[];
}
export interface LolObjectivesObjectivesTitle {
  "localizedTitle": string;
  "localizedDescription": string;
}
export interface LolObjectivesPlayerUpdateResponse {
  "playerMissions": PlayerMissionDTO[];
  "playerSeries": SeriesDTO[];
}
export interface LolObjectivesPluginRegionLocaleChangedEvent {
  "locale": string;
}
export interface LolObjectivesPooledObjectives {
  "id": string;
  "tag": string[];
  "localizedTag": string;
  "objectivesType": string;
  "startDate": number;
  "endDate": number;
  "priority": number;
  "backgroundImage": string;
  "isEnabled": boolean;
  "objectivesTitle": LolObjectivesObjectivesTitle[];
  "maxRefresh": number;
  "refreshInterval": number;
}
export interface LolObjectivesRewardGrant {
  "info": LolObjectivesRewardGrantInfo;
  "rewardGroup": LolObjectivesRewardGroup;
}
export interface LolObjectivesRewardGrantElement {
  "id": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "rewardStatus": LolObjectivesRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolObjectivesRewardGrantInfo {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "status": LolObjectivesGrantStatus;
  "grantElements": LolObjectivesRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
}
export interface LolObjectivesRewardGroup {
  "id": string;
  "internalName": string;
  "productId": string;
  "types": string[];
  "rewards": LolObjectivesSvcReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolObjectivesRewardStrategy;
  "selectionStrategyConfig": LolObjectivesSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolObjectivesRewardGroupsSelection {
  "rewardGroups": string[];
}
export type LolObjectivesRewardStatus = "FULFILLED" | "PENDING";
export type LolObjectivesRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolObjectivesRewardsProductConfig {
  "enabled": boolean;
  "serviceUrl": string;
}
export interface LolObjectivesRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolObjectivesRiotMessagingServicePayload {
  "deltaEventId": string;
  "ownerId": string;
  "updatedMissions": string[];
}
export interface LolObjectivesSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolObjectivesSeriesOpt {
  "seriesId": string;
  "option": string;
}
export interface LolObjectivesSvcReward {
  "id": string;
  "itemId": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolObjectivesTftBattlepass {
  "totalPointsEarned": number;
  "milestones": LolObjectivesTftBattlepassMilestone[];
  "bonuses": LolObjectivesTftBattlepassMilestone[];
  "activeMilestone": LolObjectivesTftBattlepassMilestone;
  "info": LolObjectivesTftBattlepassInfo;
  "lastViewedProgress": number;
  "lastViewedMilestone": LolObjectivesTftBattlepassMilestone;
  "currentLevel": number;
}
export interface LolObjectivesTftBattlepassInfo {
  "title": string;
  "description": string;
  "startDate": number;
  "endDate": number;
  "premium": boolean;
  "premiumTitle": string;
  "premiumEntitlementId": string;
  "pcPurchaseRequirement": string;
  "passId": string;
  "hasLevelPurchasing": boolean;
  "media": Record<string, string>;
  "passType": LolObjectivesTftPassType;
}
export interface LolObjectivesTftBattlepassMilestone {
  "milestoneId": string;
  "title": string;
  "description": string;
  "status": string;
  "pointsNeededForMilestone": number;
  "pointsEarnedForMilestone": number;
  "totalPointsForMilestone": number;
  "level": number;
  "iconImageUrl": string;
  "iconNeedsFrame": boolean;
  "rewards": LolObjectivesTftBattlepassReward[];
  "isPaid": boolean;
  "isLocked": boolean;
  "isKeystone": boolean;
  "isBonus": boolean;
  "isClaimRequestPending": boolean;
}
export interface LolObjectivesTftBattlepassReward {
  "name": string;
  "description": string;
  "itemId": string;
  "itemTypeId": string;
  "iconUrl": string;
  "iconNeedsFrame": boolean;
}
export interface LolObjectivesTftOrb {
  "missionId": string;
  "status": string;
  "unlockTime": number;
  "rewardLevel": number;
  "rewards": PlayerMissionRewardDTO[];
}
export type LolObjectivesTftPassType = "kBattlePass" | "kDailyLoginPass" | "kEventPass" | "kSkillTreePass" | "kUnknown";
export interface LolObjectivesTftWeeklyMissions {
  "missions": PlayerMissionDTO[];
}
export interface LolObjectivesUIMissions {
  "missions": PlayerMissionDTO[];
}
export interface LolObjectivesUIObjectives {
  "id": string;
  "localizedTitle": string[];
  "tag": string[];
  "localizedTag": string;
  "objectivesType": string;
  "startDate": number;
  "endDate": number;
  "priority": number;
  "backgroundImage": string;
  "maxRefresh": number;
  "refreshInterval": number;
  "missions": PlayerMissionDTO[];
  "isEnabled": boolean;
  "isPooledMission": boolean;
}
export interface LolObjectivesUIObjectivesCategory {
  "id": string;
  "startDate": number;
  "progressEndDate": number;
  "endDate": number;
  "categorySectionImage": string;
  "categoryName": string;
  "overrideBackgroundImage": string;
  "objectives": LolObjectivesUIObjectives[];
  "categoryType": LolObjectivesObjectiveCategoryType;
  "tftPassType": LolObjectivesTftPassType;
  "lolEventHubType": LolObjectivesEventHubType;
  "objectiveCategoryFilter": LolObjectivesObjectiveCategoryFilter;
}
export interface LolObjectivesUIObjectivesGroup {
  "gameType": string;
  "objectivesCategories": LolObjectivesUIObjectivesCategory[];
}
export interface LolObjectivesUserInfo {
  "userInfo": string;
}
export interface LolParentalControlsParentalControlsPermission {
  "permissionId": string;
  "isGranted": boolean;
}
export interface LolParentalControlsParentalControlsPermissionBatchConfig {
  "products": string[];
  "permissions": string[];
}
export interface LolParentalControlsParentalControlsPermissionBatchEntry {
  "product": string;
  "permissions": LolParentalControlsParentalControlsPermission[];
}
export interface LolParentalControlsParentalControlsStatus {
  "enabled": boolean;
  "isTextChatRestricted": boolean;
  "isVoiceChatRestricted": boolean;
  "isFriendingRestricted": boolean;
}
export interface LolPatchAppUpdateConfig {
  "disableDeprecatedProductIntegrationState": boolean;
  "enablePatchProxyState": boolean;
}
export interface LolPatchChunkingPatcherEnvironment {
  "game_patcher_available": boolean;
  "game_patcher_enabled": boolean;
}
export interface LolPatchComponentActionProgress {
  "currentItem": string;
  "total": LolPatchComponentStateProgress;
  "network": LolPatchComponentStateProgress;
  "primaryWork": LolPatchComponentStateWorkType;
}
export interface LolPatchComponentState {
  "id": string;
  "action": LolPatchComponentStateAction;
  "isUpToDate": boolean;
  "isUpdateAvailable": boolean;
  "timeOfLastUpToDateCheckISO8601"?: string;
  "isCorrupted": boolean;
  "progress"?: LolPatchComponentActionProgress;
}
export type LolPatchComponentStateAction = "CheckingForUpdates" | "Idle" | "Migrating" | "Patching" | "Repairing";
export interface LolPatchComponentStateProgress {
  "bytesComplete": number;
  "bytesRequired": number;
  "bytesPerSecond": number;
}
export type LolPatchComponentStateWorkType = "Disk" | "Network" | "Scanning";
export type LolPatchConfigReadiness = "Disabled" | "NotReady" | "Ready";
export interface LolPatchConfigStatus {
  "readiness": LolPatchConfigReadiness;
}
export interface LolPatchEntitlementsTokenResource {
  "accessToken": string;
  "token": string;
  "entitlements": string[];
}
export interface LolPatchInstallPaths {
  "gameInstallRoot": string;
  "gameExecutablePath": string;
  "tftInstallRoot": string;
}
export interface LolPatchNotification {
  "id": string;
  "notificationId": LolPatchNotificationId;
  "data": Record<string, unknown>;
}
export type LolPatchNotificationId = "BrokenPermissions" | "ConnectionError" | "DidRestoreClientBackup" | "FailedToWriteError" | "MissingFilesError" | "NotEnoughDiskSpace" | "UnspecifiedError";
export interface LolPatchPatchProxyState {
  "state": string;
  "launchable": boolean;
}
export interface LolPatchPatchSieveCompatVersion {
  "id": string;
}
export interface LolPatchPatchSieveDownload {
  "url": string;
  "scd_required": boolean;
}
export interface LolPatchPatchSieveLabelValue {
  "values": string[];
}
export interface LolPatchPatchSieveQueryResponse {
  "releases": LolPatchPatchSieveRelease[];
}
export interface LolPatchPatchSieveRelease {
  "release": LolPatchPatchSieveReleaseInfo;
  "compat_version": LolPatchPatchSieveCompatVersion;
  "download": LolPatchPatchSieveDownload;
}
export interface LolPatchPatchSieveReleaseInfo {
  "product": string;
  "id": string;
  "labels": Record<string, LolPatchPatchSieveLabelValue>;
}
export interface LolPatchPatcherInstallSettings {
  "game_patcher"?: string;
  "game_patch_url": string;
  "game_patcher_available": boolean;
  "max_download_speed_mbps": number;
  "locales": string[];
}
export interface LolPatchPatcherRegionSettings {
  "patchline": string;
  "game_patcher": string;
}
export interface LolPatchPatcherSelfUpdateSettings {
  "restart_delay": number;
}
export interface LolPatchPatcherSettings {
  "product_refresh_period": number;
  "channel": string;
  "headers": Record<string, string>;
  "self_update": LolPatchPatcherSelfUpdateSettings;
  "patchsieve_url": string;
}
export interface LolPatchPatchlineSettings {
  "install_full_path": string;
}
export interface LolPatchProductDependency {
  "product_id": string;
  "patchline_id": string;
}
export interface LolPatchProductIntegrationState {
  "updateAvailable": boolean;
  "updateRequired": boolean;
}
export interface LolPatchProductMetadata {
  "product_dependency": LolPatchProductDependency;
}
export interface LolPatchProductSettings {
  "patchline": LolPatchPatchlineSettings;
}
export interface LolPatchProductState {
  "id": string;
  "action": LolPatchComponentStateAction;
  "isUpToDate": boolean;
  "isUpdateAvailable": boolean;
  "isCorrupted": boolean;
  "isStopped": boolean;
  "percentPatched": number;
  "components": LolPatchComponentState[];
}
export interface LolPatchRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolPatchScdCookie {
  "domain": string;
  "path": string;
  "cookie": string;
}
export interface LolPatchScdCookies {
  "cookies": LolPatchScdCookie[];
}
export type LolPatchScdEnabled = "Off" | "On";
export interface LolPatchStatus {
  "connectedToPatchServer": boolean;
}
export interface LolPatchSupportedGameRelease {
  "artifact_id": string;
  "download": LolPatchPatchSieveDownload;
  "selected": boolean;
}
export interface LolPatchSupportedGameReleases {
  "supported_game_releases": LolPatchSupportedGameRelease[];
}
export interface LolPatchUxResource {
  "visible": boolean;
}
export interface LolPerksChampSelectMySelection {
  "selectedSkinId"?: number;
  "spell1Id"?: number;
  "spell2Id"?: number;
}
export interface LolPerksChampSelectPlayerSelection {
  "cellId": number;
  "championId": number;
  "selectedSkinId": number;
  "spell1Id": number;
  "spell2Id": number;
  "team": number;
  "assignedPosition": string;
  "championPickIntent": number;
  "summonerId": number;
}
export interface LolPerksChampSelectSession {
  "timer": LolPerksChampSelectTimer;
  "myTeam": LolPerksChampSelectPlayerSelection[];
  "localPlayerCellId": number;
}
export interface LolPerksChampSelectTimer {
  "adjustedTimeLeftInPhase": number;
  "totalTimeInPhase": number;
  "phase": string;
  "isInfinite": boolean;
  "internalNowInEpochMs": number;
}
export interface LolPerksChampionPreferredStyle {
  "championName": string;
  "style": number;
  "championId": number;
}
export interface LolPerksChampionRuneRecommendationsGDSResource {
  "championId": number;
  "isOverride": boolean;
  "runeRecommendations": LolPerksRuneRecommendationGDSResource[];
}
export interface LolPerksDefaultStatModsPerSubStyle {
  "id": number;
  "perks": number[];
}
export interface LolPerksGameCustomizationDTO {
  "category": string;
  "content": string;
  "queueType": number;
  "isTeambuilder": boolean;
}
export interface LolPerksGameDataChampionSummary {
  "id": number;
  "name": string;
}
export interface LolPerksGameflowGameData {
  "queue": LolPerksQueue;
  "isCustomGame": boolean;
  "gameId": number;
}
export type LolPerksGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolPerksGameflowSession {
  "phase": LolPerksGameflowPhase;
  "gameData": LolPerksGameflowGameData;
}
export interface LolPerksGetGameCustomizationDTO {
  "queueType": string;
}
export interface LolPerksInventoryRunePageCount {
  "quantity": number;
}
export interface LolPerksLobbyDto {
  "localMember": LolPerksLobbyParticipantDto;
}
export interface LolPerksLobbyParticipantDto {
  "playerSlots": LolPerksQuickPlayPresetSlotDto[];
}
export interface LolPerksLoginSession {
  "state": LolPerksLoginSessionState;
  "summonerId": number;
  "accountId": number;
}
export type LolPerksLoginSessionState = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolPerksNamecheckAuthorization {
  "subject": string;
}
export interface LolPerksNamecheckLoginDataPacket {
  "platformId": string;
}
export interface LolPerksNamecheckPayload {
  "name": string;
  "nameValidationContext": string;
  "puuid": string;
  "shard": string;
}
export interface LolPerksNamecheckResponse {
  "errors": string[];
}
export type LolPerksNamecheckValidationContext = "ITEM_PAGE" | "JADE_MASTERY_PAGE" | "JADE_RUNE_PAGE" | "RUNE_PAGE" | "TFT_PLANNER";
export interface LolPerksPerkBook {
  "currentPageId": number;
  "pages": LolPerksPerkPageResource[];
}
export interface LolPerksPerkGDSResource {
  "iconPath": string;
  "id": number;
  "longDesc": string;
  "name": string;
  "shortDesc": string;
  "tooltip": string;
  "recommendationDescriptor": string;
  "majorChangePatchVersion": string;
  "recommendationDescriptorAttributes": Record<string, number>;
}
export interface LolPerksPerkIdListResource {
  "perkIds": number[];
}
export interface LolPerksPerkPageResource {
  "current": boolean;
  "id": number;
  "isActive": boolean;
  "isValid": boolean;
  "isEditable": boolean;
  "isDeletable": boolean;
  "isTemporary": boolean;
  "name": string;
  "order": number;
  "primaryStyleId": number;
  "selectedPerkIds": number[];
  "subStyleId": number;
  "autoModifiedSelections": number[];
  "lastModified": number;
  "runeRecommendationId": string;
  "recommendationIndex": number;
  "isRecommendationOverride": boolean;
  "recommendationChampionId": number;
  "quickPlayChampionIds": number[];
  "primaryStyleName": string;
  "secondaryStyleName": string;
  "primaryStyleIconPath": string;
  "secondaryStyleIconPath": string;
  "tooltipBgPath": string;
  "pageKeystone": LolPerksUIPerkMinimal;
  "uiPerks": LolPerksUIPerkMinimal[];
}
export interface LolPerksPerkSettingResource {
  "perkIds": number[];
  "perkStyle": number;
  "perkSubStyle": number;
}
export interface LolPerksPerkSettings {
  "pages": LolPerksPerkPageResource[];
  "perShardPerkBooks": Record<string, LolPerksPerkBook>;
  "settings": LolPerksUISettings;
}
export interface LolPerksPerkStyleResource {
  "allowedSubStyles": number[];
  "iconPath": string;
  "assetMap": Record<string, string>;
  "isAdvanced": boolean;
  "id": number;
  "name": string;
  "slots": LolPerksPerkStyleSlotResource[];
  "subStyleBonus": LolPerksPerkSubStyleBonusResource[];
  "tooltip": string;
  "defaultSubStyle": number;
  "defaultPerks": number[];
  "defaultPageName": string;
  "defaultPerksWhenSplashed": number[];
  "defaultStatModsPerSubStyle": LolPerksDefaultStatModsPerSubStyle[];
}
export interface LolPerksPerkStyleSlotResource {
  "perks": number[];
  "type": string;
  "slotLabel": string;
}
export interface LolPerksPerkSubStyleBonusResource {
  "perkId": number;
  "styleId": number;
}
export interface LolPerksPerkUIPerk {
  "iconPath": string;
  "id": number;
  "styleId": number;
  "styleIdName": string;
  "longDesc": string;
  "name": string;
  "shortDesc": string;
  "tooltip": string;
  "recommendationDescriptor": string;
  "slotType": string;
}
export interface LolPerksPerkUIRecommendedPage {
  "position": string;
  "isDefaultPosition": boolean;
  "keystone": LolPerksPerkUIPerk;
  "perks": LolPerksPerkUIPerk[];
  "primaryPerkStyleId": number;
  "secondaryPerkStyleId": number;
  "primaryRecommendationAttribute": string;
  "secondaryRecommendationAttribute": string;
  "summonerSpellIds": number[];
  "recommendationId": string;
  "isRecommendationOverride": boolean;
  "recommendationChampionId": number;
}
export interface LolPerksPerkUISlot {
  "perks": number[];
  "type": string;
  "slotLabel": string;
}
export interface LolPerksPerkUIStyle {
  "allowedSubStyles": number[];
  "iconPath": string;
  "assetMap": Record<string, string>;
  "id": number;
  "name": string;
  "slots": LolPerksPerkUISlot[];
  "subStyleBonus": LolPerksPerkSubStyleBonusResource[];
  "tooltip": string;
  "defaultSubStyle": number;
  "defaultPerks": number[];
  "defaultPageName": string;
  "idName": string;
}
export interface LolPerksPerksConfigDTO {
  "styles": LolPerksPerkStyleResource[];
}
export interface LolPerksPlatformConfig {
  "PerksEnabled": boolean;
  "AutoRepairPagesEnabled": boolean;
}
export interface LolPerksPlayerInventory {
  "ownedPageCount": number;
  "customPageCount": number;
  "canAddCustomPage": boolean;
  "isCustomPageCreationUnlocked": boolean;
}
export interface LolPerksQueue {
  "id": number;
  "mapId": number;
  "isTeamBuilderManaged": boolean;
  "isCustom": boolean;
}
export interface LolPerksQuickPlayPresetSlotDto {
  "championId": number;
  "positionPreference": string;
  "perks": string;
}
export interface LolPerksRecommendedPositionsMapResource {
  "recommendedPositions": string[];
}
export interface LolPerksRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolPerksRuneRecommendationGDSResource {
  "position": string;
  "mapId": number;
  "isDefaultPosition": boolean;
  "minSummonerLevel": number;
  "perkIds": number[];
  "primaryPerkStyleId": number;
  "secondaryPerkStyleId": number;
  "summonerSpellIds": number[];
  "recommendationId": string;
}
export interface LolPerksSettingsStorageContainer {
  "data": LolPerksPerkSettings;
  "schemaVersion": number;
}
export interface LolPerksSummoner {
  "summonerId": number;
  "accountId": number;
  "displayName": string;
  "internalName": string;
  "profileIconId": number;
  "summonerLevel": number;
  "xpSinceLastLevel": number;
  "xpUntilNextLevel": number;
  "percentCompleteForNextLevel": number;
  "rerollPoints": LolPerksSummonerRerollPoints;
  "puuid": string;
}
export interface LolPerksSummonerRerollPoints {
  "pointsToReroll": number;
  "currentPoints": number;
  "numberOfRolls": number;
  "maxRolls": number;
  "pointsCostToRoll": number;
}
export interface LolPerksUIPerkMinimal {
  "id": number;
  "styleId": number;
  "name": string;
  "slotType": string;
  "iconPath": string;
}
export interface LolPerksUISettings {
  "showLongDescriptions": boolean;
  "gridModeEnabled": boolean;
  "showPresetPages": boolean;
  "gameplayPatchVersionSeen": string;
  "gameplayUpdatedPerksSeen": number[];
}
export interface LolPerksUpdatePageOrderRequest {
  "targetPageId": number;
  "destinationPageId": number;
  "offset": number;
}
export interface LolPerksValidateItemSetNameResponse {
  "success": boolean;
  "nameCheckResponse": LolPerksNamecheckResponse;
}
export interface LolPerksValidatePageNameData {
  "id": number;
  "name": string;
}
export interface LolPftGameClientEndOfGameStats {
  "gameId": number;
  "gameMode": string;
  "statsBlock": unknown;
  "queueId": number;
  "isRanked": boolean;
}
export interface LolPftGameflowGameDodge {
  "state": LolPftGameflowGameDodgeState;
  "dodgeIds": number[];
}
export type LolPftGameflowGameDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
export type LolPftGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolPftGameflowSession {
  "phase": LolPftGameflowPhase;
  "gameDodge": LolPftGameflowGameDodge;
}
export interface LolPftLoginSession {
  "state": LolPftLoginSessionStates;
  "idToken": string;
}
export type LolPftLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolPftPFTEndOfGamePlayer {
  "stats": unknown;
  "items": number[];
  "botPlayer": boolean;
  "championId": number;
  "gameId": number;
  "leaver": boolean;
  "leaves": number;
  "level": number;
  "losses": number;
  "profileIconId": number;
  "spell1Id": number;
  "spell2Id": number;
  "summonerName": string;
  "teamId": number;
  "wins": number;
  "summonerId": number;
}
export interface LolPftPFTEndOfGamePoints {
  "pointChangeFromChampionsOwned": number;
  "pointChangeFromGameplay": number;
  "pointsUsed": number;
  "previousPoints": number;
  "pointsUntilNextReroll": number;
  "rerollCount": number;
  "totalPoints": number;
}
export interface LolPftPFTEndOfGameStats {
  "difficulty": string;
  "gameId": number;
  "gameLength": number;
  "gameMode": string;
  "gameMutators": string[];
  "gameType": string;
  "invalid": boolean;
  "queueType": string;
  "ranked": boolean;
  "reportGameId": number;
  "teams": LolPftPFTEndOfGameTeam[];
  "localPlayer": LolPftPFTEndOfGamePlayer;
  "myTeamStatus": string;
  "leveledUp": boolean;
  "newSpells": number[];
  "previousLevel": number;
  "rpEarned": number;
  "accountId": number;
  "basePoints": number;
  "battleBoostIpEarned": number;
  "boostIpEarned": number;
  "firstWinBonus": number;
  "ipEarned": number;
  "ipTotal": number;
  "boostXpEarned": number;
  "experienceEarned": number;
  "experienceTotal": number;
  "loyaltyBoostXpEarned": number;
  "previousXpTotal": number;
  "timeUntilNextFirstWinBonus": number;
  "causedEarlySurrender": boolean;
  "earlySurrenderAccomplice": boolean;
  "teamEarlySurrendered": boolean;
  "gameEndedInEarlySurrender": boolean;
  "isAramGame": boolean;
  "rerollData": LolPftPFTEndOfGamePoints;
}
export interface LolPftPFTEndOfGameTeam {
  "stats": unknown;
  "players": LolPftPFTEndOfGamePlayer[];
  "memberStatusString": string;
  "name": string;
  "tag": string;
  "fullId": string;
  "teamId": number;
  "isBottomTeam": boolean;
  "isPlayerTeam": boolean;
  "isWinningTeam": boolean;
}
export interface LolPftPFTEvent {
  "playerSurveyId": number;
  "action": string;
  "data": unknown[];
}
export interface LolPftPFTMetadata {
  "accountId": number;
  "env": string;
  "webRegion": string;
  "locale": string;
  "appName": string;
  "appVersion": string;
  "systemOs": string;
  "stats": LolPftPFTEndOfGameStats;
  "homepageTimer": number;
}
export interface LolPftPFTQuestionResponse {
  "questionId": number;
  "responseData": unknown;
}
export interface LolPftPFTSurvey {
  "id": number;
  "title": string;
  "caption": string;
  "type": string;
  "display": string;
  "data": Record<string, unknown>;
}
export interface LolPftPFTSurveyResults {
  "questionResponses": LolPftPFTQuestionResponse[];
  "actions": LolPftPFTEvent[];
}
export interface LolPftPFTSurveyV1 {
  "id": number;
  "title": string;
  "caption": string;
  "type": string;
  "url": string;
}
export interface LolPftPftEntitlements {
  "authorization": LolPftPftEntitlementsAuthorization;
  "entitlements": string[];
  "issuer": string;
  "subject": string;
  "token": string;
}
export interface LolPftPftEntitlementsAccessToken {
  "clientId": string;
  "expiry": number;
  "scopes": string[];
  "token": string;
}
export interface LolPftPftEntitlementsAuthorization {
  "accessToken": LolPftPftEntitlementsAccessToken;
  "idToken": LolPftPftEntitlementsIdToken;
  "puuid": string;
}
export interface LolPftPftEntitlementsIdToken {
  "clientId": string;
  "expiry": number;
  "nonce": string;
  "token": string;
}
export interface LolPftRsoIdToken {
  "token": string;
  "expiry": number;
}
export interface LolPftSummoner {
  "puuid": string;
  "summonerId": number;
  "accountId": number;
  "summonerLevel": number;
  "unnamed": boolean;
}
export interface LolPlayerBehaviorBanNotification {
  "id": number;
  "source": LolPlayerBehaviorNotificationSource;
  "reason": string;
  "timeUntilBanExpires": number;
  "isPermaBan": boolean;
  "displayReformCard": boolean;
}
export interface LolPlayerBehaviorCodeOfConductNotification {
  "message": string;
}
export type LolPlayerBehaviorGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolPlayerBehaviorMail {
  "mailId": string;
  "message": string;
  "state": string;
  "createdAt": number;
}
export type LolPlayerBehaviorNotificationSource = "ForcedShutdown" | "Invalid" | "Login" | "Message";
export interface LolPlayerBehaviorPlayerBehaviorConfig {
  "IsLoaded": boolean;
  "CodeOfConductEnabled": boolean;
}
export interface LolPlayerBehaviorPlayerBehavior_GameflowSessionResource {
  "phase": LolPlayerBehaviorGameflowPhase;
}
export interface LolPlayerBehaviorPlayerBehavior_SimpleMessage {
  "accountId": number;
  "msgId": string;
  "type": string;
  "params": string[];
}
export interface LolPlayerBehaviorPlayerNotificationResource {
  "backgroundUrl": string;
  "created": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolPlayerBehaviorReformCard {
  "id": number;
  "punishmentType": string;
  "reason": string;
  "timeWhenPunishmentExpires": number;
  "punishmentLengthTime": number;
  "punishmentLengthGames": number;
  "restrictedChatGamesRemaining": number;
  "chatLogs": string[];
  "gameIds": number[];
  "playerFacingMessage": string;
}
export interface LolPlayerBehaviorReformCardChatLogs {
  "preGameChatLogs": string[];
  "inGameChatLogs": string[];
  "postGameChatLogs": string[];
}
export interface LolPlayerBehaviorReformCardV2 {
  "id": number;
  "punishmentType": string;
  "punishmentReason": string;
  "punishedUntilDateMillis": number;
  "punishmentLengthMillis": number;
  "punishmentLengthGames": number;
  "punishedForReformCardChatLogs": LolPlayerBehaviorReformCardChatLogs[];
  "punishedForGameIds": number[];
  "playerFacingMessage": string;
}
export interface LolPlayerBehaviorReporterFeedback {
  "id": number;
  "accountId": number;
  "messageId": string;
  "type": string;
}
export interface LolPlayerBehaviorReporterFeedbackMessage {
  "title": string;
  "message": string;
  "category": string;
  "locale": string;
  "key": string;
}
export interface LolPlayerBehaviorRestrictionNotification {
  "id": number;
  "source": LolPlayerBehaviorNotificationSource;
  "gamesRemaining": number;
  "expirationMillis": number;
  "displayReformCard": boolean;
}
export interface LolPlayerBehaviorSettingsResource {
  "data": unknown;
  "schemaVersion": number;
}
export interface LolPlayerBehaviorUserInfo {
  "userInfo": string;
}
export interface LolPlayerBehaviorUserInfoBanData {
  "restrictions": LolPlayerBehaviorUserInfoRestriction[];
}
export interface LolPlayerBehaviorUserInfoRestriction {
  "type": string;
  "reason": string;
  "scope": string;
  "dat": LolPlayerBehaviorUserInfoRestrictionData;
}
export interface LolPlayerBehaviorUserInfoRestrictionData {
  "expirationMillis": number;
  "gameData": LolPlayerBehaviorUserInfoRestrictionGameData;
  "gameLocation": string;
}
export interface LolPlayerBehaviorUserInfoRestrictionGameData {
  "productName": string;
  "gameLocation": string;
  "triggerGameId": string;
  "additionalGameIds": string[];
}
export interface LolPlayerBehaviorUserInfoToken {
  "ban": LolPlayerBehaviorUserInfoBanData;
}
export interface LolPlayerMessagingDynamicCelebrationMessagingNotificationResource {
  "id": number;
  "accountId": number;
  "msgId": string;
  "celebrationTitle": string;
  "celebrationBody": string;
  "celebrationMessage": string;
  "inventoryType": string;
  "itemId": string;
  "itemQuantity": string;
  "celebrationType": string;
  "status": number;
}
export interface LolPlayerMessagingPlayerMessagingNotificationResource {
  "id": number;
  "accountId": number;
  "msgId": string;
  "title": string;
  "body": string;
  "status": number;
}
export interface LolPlayerMessagingSimpleMessage {
  "accountId": number;
  "msgId": string;
  "type": string;
  "titleCode": string;
  "bodyCode": string;
  "params": string[];
}
export interface LolPlayerPreferencesLoginSession {
  "state": LolPlayerPreferencesLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
}
export type LolPlayerPreferencesLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolPlayerPreferencesPlayerPreferences {
  "type": string;
  "version": string;
  "data": string;
}
export interface LolPlayerPreferencesPlayerPreferencesEndpoint {
  "Enabled": boolean;
  "EnforceHttps": boolean;
  "ServiceEndpoint": string;
  "Version": string;
  "Retries": number;
}
export interface LolPlayerReportSenderGameAgnosticReportPayload {
  "offenderId": string;
  "categories": string[];
  "location": string;
  "comment": string;
  "tokenType": string;
  "token": string;
}
export interface LolPlayerReportSenderGameflowGameData {
  "gameId": number;
}
export type LolPlayerReportSenderGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolPlayerReportSenderGameflowSession {
  "phase": LolPlayerReportSenderGameflowPhase;
  "gameData": LolPlayerReportSenderGameflowGameData;
}
export interface LolPlayerReportSenderPlayerReport {
  "offenderPuuid": string;
  "obfuscatedOffenderPuuid": string;
  "categories": string[];
  "gameId": number;
  "comment": string;
}
export interface LolPlayerReportSenderPlayerReportingUnsignedConversationContext {
  "conversationId": string;
  "conversationType": string;
}
export interface LolPlayerReportSenderPlayerReportingUnsignedPlayerReportV1 {
  "offenderId": string;
  "categories": string[];
  "location": string;
  "comment": string;
  "conversationContext"?: LolPlayerReportSenderPlayerReportingUnsignedConversationContext;
  "unstructuredContext"?: unknown;
  "incidentTimestampMillis"?: number;
}
export interface LolPlayerReportSenderSummoner {
  "summonerId": number;
  "summonerLevel": number;
  "xpSinceLastLevel": number;
  "xpUntilNextLevel": number;
  "puuid": string;
}
export type LolPreEndOfGameGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolPreEndOfGameSequenceEvent {
  "name": string;
  "priority": number;
}
export interface LolPremadeVoiceAccountSettingsCategoryDataResource {
  "autoJoin": boolean;
  "autoJoinTeamVoice": boolean;
  "muteOnConnect": boolean;
  "inputMode": LolPremadeVoiceInputMode;
  "pushToTalkKey": string;
  "pushToTalkTeamKey": string;
  "voiceFontEnabledForParty": boolean;
  "voiceFontEnabledForTeam": boolean;
  "showFirstExperienceInLCU": boolean;
  "showFirstExperienceInGame": boolean;
}
export interface LolPremadeVoiceAccountSettingsCategoryResource {
  "data"?: LolPremadeVoiceAccountSettingsCategoryDataResource;
  "schemaVersion": number;
}
export interface LolPremadeVoiceAudioPropertiesResource {
  "isLoopbackEnabled": boolean;
  "micEnergy": number;
}
export type LolPremadeVoiceConfigReadinessEnum = "Disabled" | "NotReady" | "Ready";
export interface LolPremadeVoiceConfigStatus {
  "readiness": LolPremadeVoiceConfigReadinessEnum;
}
export type LolPremadeVoiceConfigType = "player" | "public";
export interface LolPremadeVoiceDeviceResource {
  "handle": string;
  "name": string;
  "usable": boolean;
  "is_current_device": boolean;
  "is_default": boolean;
}
export interface LolPremadeVoiceDeviceResourceRiotClient {
  "handle": string;
  "name": string;
  "is_effective_device": boolean;
  "is_current_device": boolean;
  "is_default": boolean;
}
export interface LolPremadeVoiceEntitlementsToken {
  "entitlements": string[];
}
export interface LolPremadeVoiceExternalSession {
  "patchlineFullName": string;
  "patchlineId": string;
  "productId": string;
}
export interface LolPremadeVoiceFirstExperience {
  "showFirstExperienceInLCU": boolean;
  "showFirstExperienceInGame": boolean;
}
export interface LolPremadeVoiceGameData {
  "gameId": number;
  "queue": LolPremadeVoiceQueue;
}
export interface LolPremadeVoiceGameEventHotkeys {
  "evtPushToTalk"?: string;
  "evtPushToTalkTeam"?: string;
}
export interface LolPremadeVoiceGameInputSettings {
  "GameEvents": LolPremadeVoiceGameEventHotkeys;
}
export interface LolPremadeVoiceGameflowGameClient {
  "running": boolean;
}
export type LolPremadeVoiceGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolPremadeVoiceGameflowSession {
  "phase": LolPremadeVoiceGameflowPhase;
  "gameClient": LolPremadeVoiceGameflowGameClient;
  "gameData": LolPremadeVoiceGameData;
}
export type LolPremadeVoiceInputMode = "pushToTalk" | "voiceActivity";
export interface LolPremadeVoiceKeyCombo {
  "keyBindings": LolPremadeVoicePushToTalkKey[];
  "sessionId": string;
}
export interface LolPremadeVoiceKeycodePushToTalkResource {
  "enabled": boolean;
  "keyCombos"?: LolPremadeVoiceKeyCombo[];
}
export interface LolPremadeVoiceLocalSettingsCategoryDataResource {
  "currentCaptureDeviceHandle": string;
  "inputVolume": number;
  "vadSensitivity": number;
  "vadAuto": boolean;
  "noiseSuppressionEnabled": boolean;
}
export interface LolPremadeVoiceLocalSettingsCategoryResource {
  "data"?: LolPremadeVoiceLocalSettingsCategoryDataResource;
  "schemaVersion": number;
}
export interface LolPremadeVoiceLoginSession {
  "connected": boolean;
}
export interface LolPremadeVoiceParentalControlsStatus {
  "enabled": boolean;
  "isTextChatRestricted": boolean;
  "isVoiceChatRestricted": boolean;
  "isFriendingRestricted": boolean;
}
export interface LolPremadeVoiceParticipantResource {
  "id": string;
  "name": string;
  "volume": number;
  "energy": number;
  "isMuted": boolean;
  "isSpeaking": boolean;
}
export interface LolPremadeVoicePartyDto {
  "partyId": string;
  "commsEnabled": boolean;
  "players": Record<string, LolPremadeVoicePlayerDto>;
}
export type LolPremadeVoicePartyMemberRoleEnum = "DECLINED" | "HOLD" | "INVITED" | "KICKED" | "LEADER" | "MEMBER";
export interface LolPremadeVoicePlayerDto {
  "displayName": string;
  "puuid": string;
  "partyId": string;
  "summonerId": number;
  "role": LolPremadeVoicePartyMemberRoleEnum;
}
export interface LolPremadeVoicePremadeVoiceParticipantDto {
  "participantId": string;
  "summonerId": number;
  "puuid": string;
  "displayName": string;
  "volume": number;
  "energy": number;
  "isMuted": boolean;
  "isSpeaking": boolean;
}
export interface LolPremadeVoicePushToTalkKey {
  "key": number;
}
export interface LolPremadeVoicePushToTalkResource {
  "pttEnabled": boolean;
  "pttKeyBinding"?: string;
}
export interface LolPremadeVoiceQueue {
  "id": number;
}
export interface LolPremadeVoiceRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolPremadeVoiceSessionResource {
  "id": string;
  "status": LolPremadeVoiceSessionStatus;
  "participants": LolPremadeVoiceParticipantResource[];
  "volume": number;
  "isMuted": boolean;
  "isTransmitEnabled": boolean;
  "isVoiceFontEnabled": boolean;
}
export type LolPremadeVoiceSessionStatus = "active" | "onHold";
export interface LolPremadeVoiceSettingsResource {
  "currentCaptureDeviceHandle": string;
  "vadHangoverTime": number;
  "vadSensitivity": number;
  "micLevel": number;
  "localMicMuted": boolean;
  "loopbackEnabled": boolean;
  "autoJoin": boolean;
  "autoJoinTeamVoice": boolean;
  "muteOnConnect": boolean;
  "vadActive": boolean;
  "pttActive": boolean;
  "vadAuto": boolean;
  "inputMode": LolPremadeVoiceInputMode;
  "pttKey"?: string;
  "pushToTalkTeamKey": string;
  "voiceFontId"?: string;
  "voiceFontEnabledForParty": boolean;
  "voiceFontEnabledForTeam": boolean;
  "noiseSuppressionAlgorithm": string;
  "noiseSuppressionLevel": string;
}
export interface LolPremadeVoiceStateResource {
  "connected": boolean;
}
export interface LolPremadeVoiceSummoner {
  "accountId": number;
  "puuid": string;
}
export interface LolPremadeVoiceVoiceAuthenticationRequest {
  "jwt": string;
  "logoutAfterAllSessionsLeft": boolean;
}
export interface LolPremadeVoiceVoiceAvailability {
  "enabled": boolean;
  "connectedToVoiceServer": boolean;
  "voiceChannelAvailable": boolean;
  "disabledAfterLogin": boolean;
  "showUI": boolean;
  "showDisconnectedState": boolean;
}
export interface LolProgressionCounter {
  "id": string;
  "name": string;
  "groupId": string;
  "direction": string;
  "startValue": number;
}
export interface LolProgressionCounterInstance {
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "counterValue": number;
}
export interface LolProgressionEntityInstance {
  "schemaVersion": string;
  "groupId": string;
  "counters": LolProgressionCounterInstance[];
  "milestones": LolProgressionMilestoneInstance[];
}
export interface LolProgressionGroup {
  "id": string;
  "schemaVersion": string;
  "productId": string;
  "name": string;
  "repeat": LolProgressionRepeat;
  "counters": LolProgressionCounter[];
  "milestones": LolProgressionMilestone[];
}
export interface LolProgressionMilestone {
  "id": string;
  "name": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "properties": Record<string, string>;
  "triggers": LolProgressionTrigger[];
  "triggerRequirement": string;
}
export interface LolProgressionMilestoneInstance {
  "milestoneId": string;
  "instanceId": string;
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "repeatSequence": number;
  "triggered": boolean;
  "triggeredTimestamp": string;
  "triggers": LolProgressionTrigger[];
}
export interface LolProgressionRepeat {
  "count": number;
  "scope": number;
  "multiplier": number;
  "milestones": LolProgressionMilestone[];
  "repeatTriggers": LolProgressionRepeatGroupTrigger[];
}
export interface LolProgressionRepeatGroupTrigger {
  "type": string;
  "counterId": string;
  "startTriggerValue": number;
  "increaseBy": number;
  "multiplier": number;
}
export interface LolProgressionTrigger {
  "type": string;
  "counterId": string;
  "entitlementItemId": string;
  "triggerValue": number;
}
export interface LolPublishingContentAccountData {
  "puuid": string;
  "accountId": string;
  "summonerLevel": string;
  "displayName": string;
}
export interface LolPublishingContentBuildInfo {
  "version": string;
  "patchline": string;
}
export interface LolPublishingContentClientData {
  "puuid": string;
  "account_id": number;
  "env": string;
  "web_region": string;
  "locale": string;
  "summoner_level": number;
  "summoner_name": string;
  "app_name": string;
  "app_version": string;
  "system_os": string;
  "protocol": string;
  "port": number;
  "assetUrls": Record<string, string>;
}
export interface LolPublishingContentPubHubConfig {
  "edge": LolPublishingContentPubHubConfigEdge;
  "appContext": LolPublishingContentPubHubConfigAppContext;
}
export interface LolPublishingContentPubHubConfigAppContext {
  "userId": string;
  "userRegion": string;
  "deviceCategory": string;
  "deviceOperatingSystem": string;
  "deviceOperatingSystemVersion": string;
  "appId": string;
  "appVersion": string;
  "appLocale": string;
  "appLanguage": string;
  "publishingLocale": string;
  "appSessionId": string;
}
export interface LolPublishingContentPubHubConfigEdge {
  "clientId": string;
  "clientRegion": string;
}
export interface LolPublishingContentPublishingLocaleSetting {
  "data": LolPublishingContentPublishingLocaleSettingData;
}
export interface LolPublishingContentPublishingLocaleSettingData {
  "publishingLocale": string;
}
export interface LolPublishingContentPublishingSettings {
  "region": string;
  "locale": string;
  "webRegion": string;
  "webLocale": string;
  "publishingLocale": string;
  "rsoPlatformId": string;
}
export interface LolPublishingContentRegionLocale {
  "region": string;
  "locale": string;
  "webRegion": string;
}
export interface LolPublishingContentSummonerInfo {
  "displayName": string;
  "summonerLevel": number;
}
export interface LolPublishingContentSystemInfo {
  "operatingSystem": LolPublishingContentSystemInfoOperatingSystem;
}
export interface LolPublishingContentSystemInfoOperatingSystem {
  "platform": string;
  "versionMajor": string;
}
export interface LolPurchaseWidgetBalance {
  "currencyType": string;
  "amount": number;
}
export interface LolPurchaseWidgetBaseSkinLineDto {
  "items": LolPurchaseWidgetSkinLineItemDto[];
  "localizedName": string;
  "skinLineDescriptions": LolPurchaseWidgetSkinLineDescriptionDto[];
  "pricingOptions": LolPurchaseWidgetPriceOptionDto[];
  "splashPath": string;
  "uncenteredSplashPath": string;
  "collectionCardPath": string;
  "collectionDescription": string;
  "tilePath": string;
}
export interface LolPurchaseWidgetBundledItemPricingInfo {
  "discountPrices": LolPurchaseWidgetDiscountPricingInfo[];
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
}
export interface LolPurchaseWidgetCapOffer {
  "id": string;
  "typeId": string;
  "label": string;
  "productId": string;
  "merchantId": string;
  "payload": LolPurchaseWidgetCapOfferPayloadEntry[];
  "active": boolean;
  "startDate": string;
  "createdDate": string;
}
export interface LolPurchaseWidgetCapOfferPayloadEntry {
  "itemPriceMap": Record<string, number>;
  "itemInstanceId": string;
  "fulfillmentTypeId": string;
  "inventoryTypeUUID": string;
}
export interface LolPurchaseWidgetCapOrdersDataDto {
  "id": string;
  "subOrders": LolPurchaseWidgetCapOrdersSubOrderDto[];
  "purchaser": LolPurchaseWidgetCapOrdersTypedIdentifierDto;
  "location": string;
  "source": string;
}
export interface LolPurchaseWidgetCapOrdersMetaDto {
  "xid": string;
}
export interface LolPurchaseWidgetCapOrdersOfferContextDto {
  "quantity": number;
  "paymentOption": string;
}
export interface LolPurchaseWidgetCapOrdersOfferDto {
  "id": string;
  "productId": string;
}
export interface LolPurchaseWidgetCapOrdersOrderDto {
  "data": LolPurchaseWidgetCapOrdersDataDto;
  "meta": LolPurchaseWidgetCapOrdersMetaDto;
}
export interface LolPurchaseWidgetCapOrdersSubOrderDto {
  "recipientId": string;
  "offerContext": LolPurchaseWidgetCapOrdersOfferContextDto;
  "offer": LolPurchaseWidgetCapOrdersOfferDto;
}
export interface LolPurchaseWidgetCapOrdersTypedIdentifierDto {
  "id": string;
  "typeId": string;
}
export interface LolPurchaseWidgetCatalogPluginItem {
  "itemId": number;
  "itemInstanceId": string;
  "owned": boolean;
  "inventoryType": string;
  "subInventoryType": string;
  "name": string;
  "subTitle": string;
  "description": string;
  "imagePath": string;
  "purchaseDate": number;
  "releaseDate": number;
  "inactiveDate": number;
  "duration": number;
  "maxQuantity": number;
  "prices": LolPurchaseWidgetCatalogPluginPrice[];
  "tags"?: string[];
  "metadata"?: LolPurchaseWidgetItemMetadataEntry[];
  "questSkinInfo"?: LolPurchaseWidgetSkinLineInfo;
  "active": boolean;
  "sale"?: LolPurchaseWidgetSale;
  "ownershipType"?: LolPurchaseWidgetInventoryOwnership;
}
export interface LolPurchaseWidgetCatalogPluginItemAssets {
  "splashPath": string;
  "iconPath": string;
  "tilePath": string;
  "previewVideoUrl": string;
  "emblems": LolPurchaseWidgetChampionSkinEmblem[];
  "colors": string[];
}
export interface LolPurchaseWidgetCatalogPluginItemWithDetails {
  "item": LolPurchaseWidgetCatalogPluginItem;
  "quantity": number;
  "requiredItems"?: LolPurchaseWidgetCatalogPluginItemWithDetails[];
  "bundledItems"?: LolPurchaseWidgetCatalogPluginItemWithDetails[];
  "minimumBundlePrices"?: LolPurchaseWidgetCatalogPluginPrice[];
  "bundledDiscountPrices"?: LolPurchaseWidgetCatalogPluginPrice[];
  "assets": LolPurchaseWidgetCatalogPluginItemAssets;
  "bundleFinalPrice": number;
  "flexible": boolean;
}
export interface LolPurchaseWidgetCatalogPluginPrice {
  "currency": string;
  "cost": number;
  "costType"?: string;
  "sale"?: LolPurchaseWidgetCatalogPluginSale;
}
export interface LolPurchaseWidgetCatalogPluginSale {
  "startDate": string;
  "endDate": string;
  "discount"?: number;
  "cost": number;
}
export interface LolPurchaseWidgetChampionSkinEmblem {
  "name": string;
  "emblemPath": LolPurchaseWidgetChampionSkinEmblemPath;
  "emblemPosition": LolPurchaseWidgetChampionSkinEmblemPosition;
}
export interface LolPurchaseWidgetChampionSkinEmblemPath {
  "large": string;
  "small": string;
}
export interface LolPurchaseWidgetChampionSkinEmblemPosition {
  "vertical": string;
  "horizontal": string;
}
export interface LolPurchaseWidgetDiscountPricingInfo {
  "cost": number;
  "originalCost": number;
  "costType": string;
  "currency": string;
  "discount": number;
}
export type LolPurchaseWidgetInventoryOwnership = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolPurchaseWidgetItemChoiceDetails {
  "item": LolPurchaseWidgetCatalogPluginItem;
  "backgroundImage": string;
  "contents": LolPurchaseWidgetItemDetails[];
  "discount": string;
  "fullPrice": number;
  "displayType": string;
  "purchaseOptions": LolPurchaseWidgetPurchaseOption[];
}
export interface LolPurchaseWidgetItemChoices {
  "choices": LolPurchaseWidgetItemChoiceDetails[];
  "validationErrors": LolPurchaseWidgetValidationErrorEntry[];
}
export interface LolPurchaseWidgetItemCost {
  "currency": string;
  "cost": number;
  "discount"?: number;
}
export interface LolPurchaseWidgetItemDefinition {
  "itemId": number;
  "itemInstanceId": string;
  "inventoryType": string;
  "subInventoryType": string;
  "name": string;
  "description": string;
  "subTitle": string;
  "imagePath": string;
  "owned": boolean;
  "assets": LolPurchaseWidgetCatalogPluginItemAssets;
  "tags": string[];
  "metadata": LolPurchaseWidgetItemMetadataEntry[];
  "duration": number;
  "bundledItemPrice"?: LolPurchaseWidgetBundledItemPricingInfo;
  "loyaltyUnlocked": boolean;
  "hasVisibleLootOdds": boolean;
  "inactiveDate": number;
}
export interface LolPurchaseWidgetItemDetails {
  "title": string;
  "subTitle": string;
  "description": string;
  "iconUrl": string;
}
export interface LolPurchaseWidgetItemKey {
  "itemId": number;
  "inventoryType": string;
  "subInventoryType": string;
}
export interface LolPurchaseWidgetItemMetadataEntry {
  "type": string;
  "value": string;
}
export interface LolPurchaseWidgetItemOrderDTO {
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
  "rpCost": number;
  "ipCost": number;
}
export interface LolPurchaseWidgetItemOwnership {
  "itemKey": LolPurchaseWidgetItemKey;
  "quantity": number;
}
export interface LolPurchaseWidgetItemPrice {
  "currencyType": string;
  "price": number;
  "originalPrice": number;
  "purchasable": boolean;
}
export interface LolPurchaseWidgetItemSale {
  "startDate": string;
  "endDate": string;
  "discount"?: number;
}
export interface LolPurchaseWidgetLoginSession {
  "puuid"?: string;
  "state": LolPurchaseWidgetLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
}
export type LolPurchaseWidgetLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolPurchaseWidgetOrderNotificationResource {
  "eventTypeId": string;
  "eventType": string;
  "status": string;
}
export interface LolPurchaseWidgetPriceDetail {
  "itemKey": LolPurchaseWidgetItemKey;
  "price": LolPurchaseWidgetItemPrice;
}
export interface LolPurchaseWidgetPriceOptionDto {
  "price": number;
  "currencyType": string;
  "currencyPaymentOption"?: string;
  "currencyName"?: string;
  "currencyImagePath"?: string;
}
export interface LolPurchaseWidgetPurchasableItem {
  "item": LolPurchaseWidgetItemDefinition;
  "dependencies": LolPurchaseWidgetItemDefinition[];
  "bundledItems": LolPurchaseWidgetItemDefinition[];
  "sale"?: LolPurchaseWidgetItemSale;
  "purchaseOptions": LolPurchaseWidgetPurchaseOption[];
  "validationErrors": LolPurchaseWidgetValidationErrorEntry[];
}
export interface LolPurchaseWidgetPurchaseItem {
  "itemKey": LolPurchaseWidgetItemKey;
  "quantity": number;
  "source": string;
  "purchaseCurrencyInfo": LolPurchaseWidgetItemPrice;
}
export type LolPurchaseWidgetPurchaseOfferOrderStates = "FAIL" | "IN_PROGRESS" | "NOT_STARTED" | "SUCCESS";
export interface LolPurchaseWidgetPurchaseOfferOrderStatus {
  "orderState": LolPurchaseWidgetPurchaseOfferOrderStates;
  "message": string;
}
export interface LolPurchaseWidgetPurchaseOfferOrderStatuses {
  "statuses": Record<string, LolPurchaseWidgetPurchaseOfferOrderStatus>;
}
export interface LolPurchaseWidgetPurchaseOfferRequestV3 {
  "offerId": string;
  "currencyType": string;
  "quantity": number;
  "price": number;
}
export interface LolPurchaseWidgetPurchaseOfferResponseV3 {
  "legacy": boolean;
  "orderDto"?: LolPurchaseWidgetCapOrdersOrderDto;
}
export interface LolPurchaseWidgetPurchaseOption {
  "priceDetails": LolPurchaseWidgetPriceDetail[];
}
export interface LolPurchaseWidgetPurchaseOrderRequestDTO {
  "accountId": number;
  "items": LolPurchaseWidgetItemOrderDTO[];
}
export interface LolPurchaseWidgetPurchaseOrderResponseDTO {
  "rpBalance": number;
  "ipBalance": number;
  "transactions": LolPurchaseWidgetTransactionResponseDTO[];
  "waitForRMS": boolean;
}
export interface LolPurchaseWidgetPurchaseRequest {
  "items": LolPurchaseWidgetPurchaseItem[];
}
export interface LolPurchaseWidgetPurchaseResponse {
  "items": LolPurchaseWidgetPurchaseItem[];
  "transactions": LolPurchaseWidgetTransaction[];
  "useRMSConfirmation": boolean;
}
export interface LolPurchaseWidgetPurchaseWidgetConfig {
  "enabled": boolean;
  "nonRefundableDisclaimerEnabled": boolean;
  "alwaysShowPurchaseDisclaimer": boolean;
}
export interface LolPurchaseWidgetRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolPurchaseWidgetSale {
  "startDate": string;
  "endDate": string;
  "prices": LolPurchaseWidgetItemCost[];
}
export interface LolPurchaseWidgetSkinLineDescriptionDto {
  "title": string;
  "description": string;
  "iconImagePath": string;
}
export interface LolPurchaseWidgetSkinLineDescriptionInfo {
  "title": string;
  "description": string;
  "iconPath": string;
}
export interface LolPurchaseWidgetSkinLineInfo {
  "name": string;
  "descriptionInfo": LolPurchaseWidgetSkinLineDescriptionInfo[];
  "splashPath": string;
  "tilePath": string;
  "collectionCardPath": string;
  "uncenteredSplashPath": string;
  "collectionDescription": string;
  "tiers": LolPurchaseWidgetSkinLineTier[];
}
export interface LolPurchaseWidgetSkinLineItemDto {
  "thumbnailImagePath": string;
  "largeImagePath"?: string;
  "localizedLongName": string;
  "localizedShortName": string;
  "largeVideoPath"?: string;
}
export interface LolPurchaseWidgetSkinLineTier {
  "id": number;
  "name": string;
  "stage": number;
  "description"?: string;
  "splashPath": string;
  "uncenteredSplashPath": string;
  "tilePath": string;
  "loadScreenPath": string;
  "shortName": string;
  "splashVideoPath"?: string;
  "collectionSplashVideoPath"?: string;
}
export interface LolPurchaseWidgetTransaction {
  "transactionId": string;
  "itemKey": LolPurchaseWidgetItemKey;
  "itemName": string;
  "iconUrl": string;
}
export interface LolPurchaseWidgetTransactionResponseDTO {
  "id": string;
  "inventoryType": string;
  "itemId": number;
}
export interface LolPurchaseWidgetValidateOfferError {
  "errorKey": string;
  "meta": string;
}
export interface LolPurchaseWidgetValidateOfferRequestV3 {
  "offerId": string;
}
export interface LolPurchaseWidgetValidateOfferResponseV3 {
  "validationErrors": LolPurchaseWidgetValidateOfferError[];
}
export interface LolPurchaseWidgetValidationError {
  "errorCode": string;
  "message": string;
  "errorDetails": Record<string, string>;
  "responseItems": string[];
}
export interface LolPurchaseWidgetValidationErrorEntry {
  "id": string;
}
export interface LolPurchaseWidgetValidationRequest {
  "items": LolPurchaseWidgetValidationRequestItem[];
  "ownedItems": LolPurchaseWidgetItemOwnership[];
}
export interface LolPurchaseWidgetValidationRequestItem {
  "itemKey": LolPurchaseWidgetItemKey;
  "quantity": number;
}
export interface LolPurchaseWidgetValidationResponse {
  "items": LolPurchaseWidgetValidationResponseItem[];
  "valid": boolean;
}
export interface LolPurchaseWidgetValidationResponseItem {
  "itemKey": LolPurchaseWidgetItemKey;
  "quantity": number;
  "validationCurrencyInfo": LolPurchaseWidgetItemPrice[];
  "sale"?: LolPurchaseWidgetSale;
  "name"?: string;
  "description"?: string;
}
export interface LolPurchaseWidgetWallet {
  "accountId": number;
  "balances": LolPurchaseWidgetBalance[];
  "version": number;
}
export interface LolRankedAchievedTier {
  "queueType": LolRankedLeagueQueueType;
  "tier": string;
  "division": number;
}
export interface LolRankedEndOfGamePlayer {
  "puuid": string;
}
export interface LolRankedEndOfGameStatsBlock {
  "gameId": number;
  "ranked": boolean;
  "teams": LolRankedEndOfGameTeam[];
}
export interface LolRankedEndOfGameTeam {
  "players": LolRankedEndOfGamePlayer[];
}
export interface LolRankedEosNotificationResource {
  "notificationName": string;
  "notificationType": string;
  "seasonEndTime": number;
  "queue": string;
  "tier": string;
  "division": string;
}
export type LolRankedEosNotificationType = "FIRST_WARNING" | "SEASON_ENDED" | "SECOND_WARNING";
export interface LolRankedEosNotificationsConfig {
  "config": LolRankedEosNotificationsConfigEntry[];
}
export interface LolRankedEosNotificationsConfigEntry {
  "name": string;
  "offsetTime1": number;
  "offsetTime2": number;
  "offsetTime3": number;
}
export interface LolRankedEosSettingsData {
  "notificationShown": boolean;
}
export interface LolRankedEosSettingsResource {
  "data": LolRankedEosSettingsData;
  "schemaVersion": number;
}
export interface LolRankedGameflowGameData {
  "queue": LolRankedQueue;
}
export type LolRankedGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolRankedGameflowSession {
  "phase": LolRankedGameflowPhase;
  "gameData": LolRankedGameflowGameData;
}
export interface LolRankedGlobalNotification {
  "notifyReason": string;
  "participantId": string;
  "queueType": string;
  "tier": string;
  "position": number;
}
export interface LolRankedLcuLeagueNotification {
  "id": number;
  "msgId": string;
  "displayType": LolRankedNotificationDisplayType;
  "notifyReason": string;
  "changeReason": string;
  "queueType": LolRankedLeagueQueueType;
  "gameId": number;
  "provisionalGamesRemaining": number;
  "tier": string;
  "division": LolRankedLeagueDivision;
  "numberOfPromotions": number;
  "miniseriesProgress": string;
  "leaguePoints": number;
  "leaguePointsDelta": number;
  "ratedTier": LolRankedRatedTier;
  "ratedRating": number;
  "ratedRatingDelta": number;
  "eligibleForPromoHelper": boolean;
  "miniseriesWins": number;
  "timeUntilInactivityStatusChanges": number;
  "rewardEarnedId": string;
  "rewardEarnedType": string;
  "rewardEarnedTitle": string;
  "rewardEarnedDescription": string;
  "rewardEarnedTier": string;
  "rewardOverrideImagePath": string;
  "promoSeriesForRanksEnabled": boolean;
  "consolationLpUsed": number;
  "afkLpPenaltyAmount": number;
  "afkLpPenaltyLevel": number;
  "wasAfkOrLeaver": boolean;
  "canDemoteFromTier": boolean;
  "winStreak": number;
  "wins": number;
  "losses": number;
  "lpBonusAppliedReason": string;
  "leaguePointDeltaBreakdown": Record<string, number>;
}
export type LolRankedLeagueDivision = "I" | "II" | "III" | "IV" | "NA" | "V";
export interface LolRankedLeagueDivisionInfo {
  "tier": string;
  "division": LolRankedLeagueDivision;
  "maxLeagueSize": number;
  "apexUnlockTimeMillis": number;
  "minLpForApexTier": number;
  "topNumberOfPlayers": number;
  "standings": LolRankedLeagueStanding[];
}
export interface LolRankedLeagueLadderDTO {
  "queueType": string;
  "tier": string;
  "provisionalGameThreshold": number;
  "entries": LolRankedLeagueLadderEntryDTO[];
  "maxLeagueSize": number;
  "nextApexUpdate": number;
  "apexUnlockTimeMillis": number;
  "minLpForTier": number;
  "topNumberOfPlayers": number;
}
export interface LolRankedLeagueLadderEntryDTO {
  "summonerId": number;
  "puuid": string;
  "summonerName": string;
  "tier": string;
  "rank": string;
  "leaguePoints": number;
  "miniSeriesProgress": string;
  "wins": number;
  "losses": number;
  "provisionalGamesRemaining": number;
  "previousDayLeaguePosition": number;
  "previousSeasonEndTier": string;
  "previousSeasonEndRank": string;
  "earnedRegaliaRewardIds": string[];
}
export interface LolRankedLeagueLadderInfo {
  "queueType": LolRankedLeagueQueueType;
  "tier": string;
  "provisionalGameThreshold": number;
  "divisions": LolRankedLeagueDivisionInfo[];
  "nextApexUpdateMillis": number;
  "requestedRankedEntry"?: LolRankedLeagueStanding;
}
export interface LolRankedLeagueNotification {
  "notifyReason": string;
  "changeReason": string;
  "queueType": string;
  "gameId": number;
  "provisionalGamesRemaining": number;
  "tier": string;
  "rank": string;
  "miniseriesProgress": string;
  "leaguePoints": number;
  "leaguePointsDelta": number;
  "ratedTier": string;
  "ratedRating": number;
  "ratedRatingDelta": number;
  "eligibleForPromoHelper": boolean;
  "promoSeriesForRanksEnabled": boolean;
  "consolationLpUsed": number;
  "afkLpPenaltyAmount": number;
  "afkLpPenaltyLevel": number;
  "wasAfkOrLeaver": boolean;
  "canDemoteFromTier": boolean;
  "winStreak": number;
  "wins": number;
  "losses": number;
  "leaguePointDeltaBreakdown": Record<string, number>;
}
export interface LolRankedLeagueNotifications {
  "leagueNotifications": LolRankedLeagueNotification[];
  "globalNotifications": LolRankedGlobalNotification[];
  "rewardNotifications": LolRankedRewardNotification[];
}
export type LolRankedLeagueQueueType = "CHERRY" | "JADE_RANKED_SOLO_5x5" | "NONE" | "RANKED_FLEX_SR" | "RANKED_FLEX_TT" | "RANKED_PREMADE_5x5" | "RANKED_SOLO_5x5" | "RANKED_TFT" | "RANKED_TFT_DOUBLE_UP" | "RANKED_TFT_PAIRS" | "RANKED_TFT_TURBO";
export interface LolRankedLeagueStanding {
  "summonerId": number;
  "puuid": string;
  "summonerName": string;
  "position": number;
  "positionDelta": number;
  "previousPosition": number;
  "tier": string;
  "division": LolRankedLeagueDivision;
  "leaguePoints": number;
  "miniseriesResults": LolRankedMiniseries[];
  "wins": number;
  "losses": number;
  "provisionalGamesRemaining": number;
  "isProvisional": boolean;
  "previousSeasonEndTier": string;
  "previousSeasonEndDivision": LolRankedLeagueDivision;
  "earnedRegaliaRewardIds": string[];
  "rankedRegaliaLevel": number;
  "pendingPromotion": boolean;
  "pendingDemotion": boolean;
}
export interface LolRankedLeagueTierAndRankDTO {
  "playerOrTeamId": string;
  "playerOrTeamName": string;
  "queueType": string;
  "tier": string;
  "rank": string;
}
export interface LolRankedLeaguesSeasonRewardConfig {
  "QualificationWarningEnabled": boolean;
}
export interface LolRankedLoginSession {
  "state": LolRankedLoginSessionStates;
  "summonerId": number;
  "accountId": number;
}
export type LolRankedLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolRankedLolEosRewardGameData {
  "id": string;
  "name": string;
  "title": string;
  "description": string;
  "tier": LolRankedLolEosRewardTier;
  "type": LolRankedLolEosRewardType;
  "overrideImagePath": string;
}
export interface LolRankedLolEosRewardGroupGameData {
  "id": string;
  "rewardNames": string[];
}
export type LolRankedLolEosRewardTier = "kBronze" | "kChallenger" | "kDiamond" | "kEmerald" | "kGold" | "kGrandmaster" | "kIron" | "kMaster" | "kNone" | "kPlatinum" | "kSilver";
export type LolRankedLolEosRewardType = "kChampion" | "kEmote" | "kEternalsCapsule" | "kNone" | "kRegaliaBanner" | "kSummonerIcon" | "kVictoriousChroma" | "kVictoriousSkin" | "kVictoriousSkinBorder";
export interface LolRankedLolEosRewardsConfigGameData {
  "seasonId": number;
  "rewards": LolRankedLolEosRewardGameData[];
  "rewardGroups": LolRankedLolEosRewardGroupGameData[];
}
export type LolRankedMiniseries = "L" | "N" | "W";
export type LolRankedNotificationDisplayType = "MODAL" | "NONE" | "TOAST" | "VIGNETTE";
export interface LolRankedParticipantTiers {
  "summonerId": number;
  "achievedTiers": LolRankedAchievedTier[];
}
export interface LolRankedQueue {
  "type": unknown;
}
export interface LolRankedQueuesAndPuuidsPayload {
  "queueTypes": LolRankedLeagueQueueType[];
  "summonerIds": number[];
}
export interface LolRankedRankedQueueStats {
  "queueType": LolRankedLeagueQueueType;
  "provisionalGameThreshold": number;
  "provisionalGamesRemaining": number;
  "isProvisional": boolean;
  "tier": string;
  "division": LolRankedLeagueDivision;
  "leaguePoints": number;
  "miniSeriesProgress": string;
  "ratedTier": LolRankedRatedTier;
  "ratedRating": number;
  "wins": number;
  "losses": number;
  "currentSeasonWinsForRewards": number;
  "previousSeasonWinsForRewards": number;
  "highestTier": string;
  "highestDivision": LolRankedLeagueDivision;
  "previousSeasonEndTier": string;
  "previousSeasonEndDivision": LolRankedLeagueDivision;
  "previousSeasonHighestTier": string;
  "previousSeasonHighestDivision": LolRankedLeagueDivision;
  "climbingIndicatorActive": boolean;
  "warnings"?: LolRankedRankedQueueWarnings;
}
export interface LolRankedRankedQueueStatsDTO {
  "queueType": string;
  "provisionalGameThreshold": number;
  "provisionalGamesRemaining": number;
  "tier": string;
  "rank": string;
  "leaguePoints": number;
  "miniSeriesProgress": string;
  "ratedTier": string;
  "ratedRating": number;
  "wins": number;
  "losses": number;
  "currentSeasonWinsForRewards": number;
  "previousSeasonWinsForRewards": number;
  "highestTier": string;
  "highestRank": string;
  "previousSeasonEndTier": string;
  "previousSeasonEndRank": string;
  "previousSeasonHighestTier": string;
  "previousSeasonHighestRank": string;
  "climbingIndicatorActive": boolean;
  "warnings"?: LolRankedRankedQueueWarningsDTO;
}
export interface LolRankedRankedQueueWarnings {
  "displayDecayWarning": boolean;
  "timeUntilInactivityStatusChanges": number;
  "demotionWarning": number;
  "daysUntilDecay": number;
}
export interface LolRankedRankedQueueWarningsDTO {
  "displayDecayWarning": boolean;
  "timeUntilInactivityStatusChanges": number;
  "demotionWarning": number;
  "apexDaysUntilDecay": number;
  "daysUntilDecay": number;
}
export interface LolRankedRankedStats {
  "queues": LolRankedRankedQueueStats[];
  "queueMap": Record<string, LolRankedRankedQueueStats>;
  "highestRankedEntry"?: LolRankedRankedQueueStats;
  "highestRankedEntrySR"?: LolRankedRankedQueueStats;
  "earnedRegaliaRewardIds": string[];
  "rankedRegaliaLevel": number;
  "highestCurrentSeasonReachedTierSR": string;
  "highestPreviousSeasonEndTier": string;
  "highestPreviousSeasonEndDivision": LolRankedLeagueDivision;
  "splitsProgress": Record<string, number>;
  "currentSeasonSplitPoints": number;
  "previousSeasonSplitPoints": number;
  "seasons": Record<string, LolRankedSeasonDTO>;
}
export interface LolRankedRankedStatsDTO {
  "queues": LolRankedRankedQueueStatsDTO[];
  "earnedRegaliaRewardIds": string[];
  "highestPreviousSeasonEndTier": string;
  "highestPreviousSeasonEndRank": string;
  "splitsProgress": Record<string, number>;
  "currentSeasonSplitPoints": number;
  "previousSeasonSplitPoints": number;
  "seasons": Record<string, LolRankedSeasonDTO>;
  "shouldShowIndicator": boolean;
}
export interface LolRankedRatedLadderEntryDTO {
  "summonerId": number;
  "puuid": string;
  "summonerName": string;
  "ratedTier": string;
  "ratedRating": number;
  "wins": number;
  "previousUpdateLadderPosition": number;
}
export interface LolRankedRatedLadderInfo {
  "queueType": LolRankedLeagueQueueType;
  "standings": LolRankedRatedLadderStanding[];
}
export interface LolRankedRatedLadderStanding {
  "summonerId": number;
  "puuid": string;
  "summonerName": string;
  "ratedTier": LolRankedRatedTier;
  "leaguePoints": number;
  "wins": number;
  "position": number;
  "positionDelta": number;
  "previousPosition": number;
}
export type LolRankedRatedTier = "BLUE" | "GRAY" | "GREEN" | "NONE" | "ORANGE" | "PURPLE";
export interface LolRankedRewardNotification {
  "rewardGroupId": string;
  "seasonId": number;
}
export interface LolRankedSeasonDTO {
  "currentSeasonId": number;
  "currentSeasonEnd": number;
  "nextSeasonStart": number;
}
export interface LolRankedSequenceEvent {
  "name": string;
  "priority": number;
}
export type LolRankedSeverity = "ALERT" | "WARNING";
export interface LolRankedSignedRankedStatsDTO {
  "queues": LolRankedRankedQueueStatsDTO[];
  "earnedRegaliaRewardIds": string[];
  "highestPreviousSeasonEndTier": string;
  "highestPreviousSeasonEndRank": string;
  "splitsProgress": Record<string, number>;
  "currentSeasonSplitPoints": number;
  "previousSeasonSplitPoints": number;
  "seasons": Record<string, LolRankedSeasonDTO>;
  "shouldShowIndicator": boolean;
  "jwt": string;
}
export interface LolRankedSocialLeaderboardRankedQueueStats {
  "queueType": LolRankedLeagueQueueType;
  "provisionalGameThreshold": number;
  "provisionalGamesRemaining": number;
  "isProvisional": boolean;
  "tier": string;
  "division": LolRankedLeagueDivision;
  "leaguePoints": number;
  "miniSeriesProgress": string;
  "ratedTier": LolRankedRatedTier;
  "ratedRating": number;
  "wins": number;
  "losses": number;
}
export interface LolRankedSocialLeaderboardRankedQueueStatsDTO {
  "queueType": string;
  "provisionalGameThreshold": number;
  "provisionalGamesRemaining": number;
  "tier": string;
  "rank": string;
  "leaguePoints": number;
  "miniSeriesProgress": string;
  "ratedTier": string;
  "ratedRating": number;
  "wins": number;
  "losses": number;
}
export interface LolRankedSummoner {
  "summonerId": number;
  "puuid": string;
}
export interface LolRankedVictoriousSkin {
  "splitPointsByHighestSeasonEndTier": Record<string, number>;
  "itemInstanceId": string;
}
export interface LolRegaliaAccountIdAndSummonerId {
  "summonerId"?: number;
}
export interface LolRegaliaChatPresence {
  "summonerId": number;
  "icon": number;
  "lol": LolRegaliaChatPresenceLolData;
}
export interface LolRegaliaChatPresenceExternal {
  "id": string;
  "summonerId": number;
  "icon": number;
  "lol": Record<string, string>;
}
export interface LolRegaliaChatPresenceLolData {
  "level": number;
  "rankedLeagueTier"?: string;
  "rankedLeagueDivision": LolRegaliaLeagueDivision;
  "rankedLeagueQueue": LolRegaliaLeagueQueueType;
  "rankedSplitRewardLevel": number;
  "rankedPrevSeasonTier"?: string;
  "rankedPrevSeasonDivision": LolRegaliaLeagueDivision;
  "regalia"?: LolRegaliaRegaliaSettings;
}
export interface LolRegaliaGameDataRegalia {
  "id": string;
  "idSecondary": string;
  "assetPath": string;
  "isSelectable": boolean;
  "regaliaType": string;
  "localizedName": string;
  "localizedDescription": string;
  "isTencentOnly": boolean;
}
export interface LolRegaliaInventoryItem {
  "itemId": number;
  "uuid": string;
  "purchaseDate": string;
}
export interface LolRegaliaItemKey {
  "inventoryType": string;
  "itemId": number;
}
export type LolRegaliaLeagueDivision = "I" | "II" | "III" | "IV" | "NA" | "V";
export type LolRegaliaLeagueQueueType = "CHERRY" | "JADE_RANKED_SOLO_5x5" | "NONE" | "RANKED_FLEX_SR" | "RANKED_FLEX_TT" | "RANKED_PREMADE_5x5" | "RANKED_SOLO_5x5" | "RANKED_TFT" | "RANKED_TFT_DOUBLE_UP" | "RANKED_TFT_PAIRS" | "RANKED_TFT_TURBO";
export interface LolRegaliaLoadout {
  "id": string;
  "name": string;
  "scope": string;
  "loadout": LolRegaliaRegaliaLoadout;
}
export interface LolRegaliaRankedQueueStats {
  "queueType": LolRegaliaLeagueQueueType;
  "isProvisional": boolean;
  "tier": string;
  "division": LolRegaliaLeagueDivision;
}
export interface LolRegaliaRankedStats {
  "queues": LolRegaliaRankedQueueStats[];
  "highestRankedEntry"?: LolRegaliaRankedQueueStats;
  "rankedRegaliaLevel": number;
  "highestPreviousSeasonEndTier": string;
}
export interface LolRegaliaRegalia {
  "profileIconId": number;
  "crestType": string;
  "bannerType": string;
  "summonerLevel": number;
  "lastSeasonHighestRank"?: string;
  "highestRankedEntry"?: LolRegaliaRegaliaRankedEntry;
  "selectedPrestigeCrest": number;
}
export interface LolRegaliaRegaliaAsync {
  "md5": string;
}
export type LolRegaliaRegaliaBannerType = "blank" | "lastSeasonHighestRank";
export type LolRegaliaRegaliaCrestType = "none" | "prestige" | "ranked";
export interface LolRegaliaRegaliaFrontendConfig {
  "hovercardEnabled": boolean;
  "selectionsEnabled": boolean;
}
export interface LolRegaliaRegaliaInventoryItem {
  "items": LolRegaliaGameDataRegalia[];
  "isOwned": boolean;
  "purchaseDate": string;
}
export interface LolRegaliaRegaliaLoadout {
  "REGALIA_CREST_SLOT": LolRegaliaItemKey;
  "REGALIA_BANNER_SLOT": LolRegaliaItemKey;
}
export interface LolRegaliaRegaliaPlatformConfig {
  "HovercardEnabled": boolean;
  "SelectionsEnabled": boolean;
}
export interface LolRegaliaRegaliaPreferences {
  "preferredCrestType": string;
  "preferredBannerType": string;
  "selectedPrestigeCrest": number;
}
export interface LolRegaliaRegaliaRankedEntry {
  "queueType": LolRegaliaLeagueQueueType;
  "tier": string;
  "division": LolRegaliaLeagueDivision;
  "splitRewardLevel": number;
}
export interface LolRegaliaRegaliaSettings {
  "crestType": LolRegaliaRegaliaCrestType;
  "bannerType": LolRegaliaRegaliaBannerType;
  "selectedPrestigeCrest": number;
}
export interface LolRegaliaRegaliaSettingsExternal {
  "crestType": number;
  "bannerType": number;
  "selectedPrestigeCrest": number;
}
export interface LolRegaliaRegaliaWithPreferences {
  "profileIconId": number;
  "crestType": string;
  "bannerType": string;
  "preferredCrestType": string;
  "preferredBannerType": string;
  "selectedPrestigeCrest": number;
  "summonerLevel": number;
  "lastSeasonHighestRank"?: string;
  "highestRankedEntry"?: LolRegaliaRegaliaRankedEntry;
}
export interface LolRegaliaSummoner {
  "summonerId": number;
  "profileIconId": number;
  "summonerLevel": number;
  "puuid": string;
}
export interface LolRegaliaSummonerProfile {
  "regalia": string;
}
export interface LolRegaliaSummonerProfileUpdate {
  "key": string;
  "value": string;
}
export interface LolRemedyHostageDetectedNotification {
  "offenderPuuid": string;
  "wasGameTerminated": boolean;
}
export interface LolRemedyMail {
  "mailId": string;
  "message": string;
  "state": string;
  "createdAt": number;
}
export interface LolReplaysClashPlaymodeRestrictedInfo {
  "isRestricted": boolean;
}
export interface LolReplaysGAMHSEvent {
  "type": string;
  "timestamp": number;
  "participantId": number;
  "teamId": number;
  "itemId": number;
  "killerId": number;
  "victimId": number;
  "skillSlot": number;
  "position": LolReplaysGAMHSPosition;
  "assistingParticipantIds": number[];
  "buildingType": string;
  "laneType": string;
  "towerType": string;
  "monsterType": string;
  "monsterSubType": string;
}
export interface LolReplaysGAMHSGame {
  "endOfGameResult": string;
  "gameCreation": number;
  "gameDuration": number;
  "gameEndTimestamp": number;
  "gameId": number;
  "gameMode": string;
  "gameName": string;
  "gameStartTimestamp": number;
  "gameType": string;
  "gameVersion": string;
  "mapId": number;
  "platformId": string;
  "queueId": number;
  "seasonId": number;
  "tournamentCode": string;
}
export interface LolReplaysGAMHSMatchHistoryData {
  "metadata": LolReplaysGAMHSMatchHistoryMetadata;
  "json": unknown;
}
export interface LolReplaysGAMHSMatchHistoryMetadata {
  "product": string;
  "data_version": number;
  "info_type": string;
  "match_id": string;
  "tags": string[];
  "participants": string[];
  "timestamp": number;
  "private": boolean;
}
export interface LolReplaysGAMHSParticipant {
  "participantId": number;
  "teamId": number;
  "championId": number;
  "spell1Id": number;
  "spell2Id": number;
  "highestAchievedSeasonTier": string;
  "stats": LolReplaysGAMHSParticipantStatistics;
  "timeline": LolReplaysGAMHSTimeline;
}
export interface LolReplaysGAMHSParticipantFrame {
  "participantId": number;
  "position": LolReplaysGAMHSPosition;
  "currentGold": number;
  "totalGold": number;
  "level": number;
  "xp": number;
  "minionsKilled": number;
  "jungleMinionsKilled": number;
  "dominionScore": number;
  "teamScore": number;
}
export interface LolReplaysGAMHSParticipantIdentities {
  "participantId": number;
  "player": LolReplaysGAMHSParticipantIdentityPlayer;
}
export interface LolReplaysGAMHSParticipantIdentityPlayer {
  "puuid": string;
  "platformId": string;
  "accountId": number;
  "summonerId": number;
  "summonerName": string;
  "gameName": string;
  "tagLine": string;
  "currentPlatformId": string;
  "currentAccountId": number;
  "matchHistoryUri": string;
  "profileIcon": number;
}
export interface LolReplaysGAMHSParticipantStatistics {
  "participantId": number;
  "win": boolean;
  "item0": number;
  "item1": number;
  "item2": number;
  "item3": number;
  "item4": number;
  "item5": number;
  "item6": number;
  "kills": number;
  "deaths": number;
  "assists": number;
  "largestKillingSpree": number;
  "largestMultiKill": number;
  "killingSprees": number;
  "longestTimeSpentLiving": number;
  "doubleKills": number;
  "tripleKills": number;
  "quadraKills": number;
  "pentaKills": number;
  "unrealKills": number;
  "totalDamageDealt": number;
  "magicDamageDealt": number;
  "physicalDamageDealt": number;
  "trueDamageDealt": number;
  "largestCriticalStrike": number;
  "totalDamageDealtToChampions": number;
  "magicDamageDealtToChampions": number;
  "physicalDamageDealtToChampions": number;
  "trueDamageDealtToChampions": number;
  "totalHeal": number;
  "totalUnitsHealed": number;
  "totalDamageTaken": number;
  "magicalDamageTaken": number;
  "physicalDamageTaken": number;
  "trueDamageTaken": number;
  "goldEarned": number;
  "goldSpent": number;
  "turretKills": number;
  "inhibitorKills": number;
  "totalMinionsKilled": number;
  "neutralMinionsKilled": number;
  "neutralMinionsKilledTeamJungle": number;
  "neutralMinionsKilledEnemyJungle": number;
  "totalTimeCrowdControlDealt": number;
  "champLevel": number;
  "visionWardsBoughtInGame": number;
  "sightWardsBoughtInGame": number;
  "wardsPlaced": number;
  "wardsKilled": number;
  "firstBloodKill": boolean;
  "firstBloodAssist": boolean;
  "firstTowerKill": boolean;
  "firstTowerAssist": boolean;
  "firstInhibitorKill": boolean;
  "firstInhibitorAssist": boolean;
  "gameEndedInEarlySurrender": boolean;
  "gameEndedInSurrender": boolean;
  "causedEarlySurrender": boolean;
  "earlySurrenderAccomplice": boolean;
  "teamEarlySurrendered": boolean;
  "combatPlayerScore": number;
  "objectivePlayerScore": number;
  "totalPlayerScore": number;
  "totalScoreRank": number;
  "damageSelfMitigated": number;
  "damageDealtToObjectives": number;
  "damageDealtToTurrets": number;
  "visionScore": number;
  "timeCCingOthers": number;
  "playerScore0": number;
  "playerScore1": number;
  "playerScore2": number;
  "playerScore3": number;
  "playerScore4": number;
  "playerScore5": number;
  "playerScore6": number;
  "playerScore7": number;
  "playerScore8": number;
  "playerScore9": number;
  "perkPrimaryStyle": number;
  "perkSubStyle": number;
  "perk0": number;
  "perk0Var1": number;
  "perk0Var2": number;
  "perk0Var3": number;
  "perk1": number;
  "perk1Var1": number;
  "perk1Var2": number;
  "perk1Var3": number;
  "perk2": number;
  "perk2Var1": number;
  "perk2Var2": number;
  "perk2Var3": number;
  "perk3": number;
  "perk3Var1": number;
  "perk3Var2": number;
  "perk3Var3": number;
  "perk4": number;
  "perk4Var1": number;
  "perk4Var2": number;
  "perk4Var3": number;
  "perk5": number;
  "perk5Var1": number;
  "perk5Var2": number;
  "perk5Var3": number;
  "playerAugment1": number;
  "playerAugment2": number;
  "playerAugment3": number;
  "playerAugment4": number;
  "playerAugment5": number;
  "playerAugment6": number;
  "playerSubteamId": number;
  "subteamPlacement": number;
}
export interface LolReplaysGAMHSPosition {
  "x": number;
  "y": number;
}
export interface LolReplaysGAMHSTeam {
  "teamId": number;
  "win": string;
  "firstBlood": boolean;
  "firstTower": boolean;
  "firstInhibitor": boolean;
  "firstBaron": boolean;
  "firstDargon": boolean;
  "towerKills": number;
  "inhibitorKills": number;
  "baronKills": number;
  "dragonKills": number;
  "vilemawKills": number;
  "riftHeraldKills": number;
  "hordeKills": number;
  "dominionVictoryScore": number;
  "bans": LolReplaysGAMHSTeamBan[];
}
export interface LolReplaysGAMHSTeamBan {
  "championId": number;
  "pickTurn": number;
}
export interface LolReplaysGAMHSTimeline {
  "participantId": number;
  "role": string;
  "lane": string;
  "creepsPerMinDeltas": Record<string, number>;
  "xpPerMinDeltas": Record<string, number>;
  "goldPerMinDeltas": Record<string, number>;
  "csDiffPerMinDeltas": Record<string, number>;
  "xpDiffPerMinDeltas": Record<string, number>;
  "damageTakenPerMinDeltas": Record<string, number>;
  "damageTakenDiffPerMinDeltas": Record<string, number>;
}
export interface LolReplaysGameflowAvailability {
  "state": string;
}
export interface LolReplaysGameflowGameClient {
  "running": boolean;
}
export type LolReplaysGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolReplaysGameflowSession {
  "phase": LolReplaysGameflowPhase;
  "gameClient": LolReplaysGameflowGameClient;
}
export type LolReplaysGameflowWatchPhase = "None" | "WatchFailedToLaunch" | "WatchInProgress" | "WatchStarted";
export interface LolReplaysInstallPaths {
  "gameInstallRoot": string;
  "gameExecutablePath": string;
}
export type LolReplaysMetadataState = "checking" | "download" | "downloading" | "error" | "found" | "incompatible" | "lost" | "missingOrExpired" | "retryDownload" | "unsupported" | "watch";
export interface LolReplaysRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolReplaysReplayContextData {
  "componentType": string;
}
export interface LolReplaysReplayCreateMetadata {
  "gameVersion": string;
  "gameType": string;
  "queueId": number;
  "gameEnd": number;
}
export interface LolReplaysReplayMetadata {
  "state": LolReplaysMetadataState;
  "gameId": number;
  "downloadProgress": number;
}
export interface LolReplaysReplaysConfiguration {
  "isReplaysEnabled": boolean;
  "isReplaysForEndOfGameEnabled": boolean;
  "isReplaysForMatchHistoryEnabled": boolean;
  "isPatching": boolean;
  "isInTournament": boolean;
  "isPlayingGame": boolean;
  "isPlayingReplay": boolean;
  "isLoggedIn": boolean;
  "gameVersion": string;
  "minServerVersion": string;
  "minutesUntilReplayConsideredLost": number;
}
export interface LolReplaysReplaysDynamicConfig {
  "MinSupportedGameServerVersion": string;
  "MinutesUntilReplayConsideredLost": number;
}
export interface LolReplaysReplaysSettingsData {
  "replays-folder-path": string;
  "highlights-folder-path": string;
}
export interface LolReplaysReplaysSettingsResource {
  "data": LolReplaysReplaysSettingsData;
}
export interface LolReplaysRoflFileMetadata {
  "gameLength": number;
  "gameVersion": string;
  "lastGameChunkId": number;
  "lastKeyFrameId": number;
}
export type LolRewardTrackCelebrationType = "FULLSCREEN" | "NONE" | "TOAST";
export interface LolRewardTrackCounter {
  "id": string;
  "name": string;
  "groupId": string;
  "direction": string;
  "startValue": number;
}
export interface LolRewardTrackCounterInstance {
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "counterValue": number;
}
export interface LolRewardTrackEntityInstance {
  "schemaVersion": string;
  "groupId": string;
  "counters": LolRewardTrackCounterInstance[];
  "milestones": LolRewardTrackMilestoneInstance[];
}
export interface LolRewardTrackFSC {
  "id": string;
  "canvas": LolRewardTrackFSCCanvas;
  "media": LolRewardTrackFSCMedia;
  "rewards": LolRewardTrackFSCRewards[];
}
export interface LolRewardTrackFSCCanvas {
  "title": string;
  "subtitle": string;
  "description": string;
  "canvasBackgroundImage": string;
  "canvasSize": LolRewardTrackFSCCanvasSize;
  "canvasDesign": string;
  "buttonText": string;
}
export type LolRewardTrackFSCCanvasSize = "FULL" | "LARGE" | "MEDIUM" | "SMALL";
export interface LolRewardTrackFSCMedia {
  "introAnimation": string;
  "introAnimationAudio": string;
  "introLowSpecImage": string;
  "loopAnimation": string;
  "loopAnimationAudio": string;
  "transitionAnimation": string;
  "transitionAnimationAudio": string;
}
export interface LolRewardTrackFSCRewards {
  "itemId": number;
  "image": string;
  "imageOverlay": string;
  "title": string;
  "subtitle": string;
}
export type LolRewardTrackGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolRewardTrackGrantorDescription {
  "appName": string;
  "entityId": string;
}
export interface LolRewardTrackGroup {
  "id": string;
  "schemaVersion": string;
  "productId": string;
  "name": string;
  "repeat": LolRewardTrackRepeat;
  "counters": LolRewardTrackCounter[];
  "milestones": LolRewardTrackMilestone[];
}
export interface LolRewardTrackLolInventoryType {
  "inventoryTypeId": string;
  "capInventoryTypeId": string;
}
export interface LolRewardTrackMilestone {
  "id": string;
  "name": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "properties": Record<string, string>;
  "triggers": LolRewardTrackTrigger[];
  "triggerRequirement": string;
}
export interface LolRewardTrackMilestoneInstance {
  "milestoneId": string;
  "instanceId": string;
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "repeatSequence": number;
  "triggered": boolean;
  "triggeredTimestamp": string;
  "triggers": LolRewardTrackTrigger[];
}
export interface LolRewardTrackNextRewardUIData {
  "thumbIconPath": string;
  "state": LolRewardTrackRewardTrackItemHeaderType;
  "name": string;
  "description": string;
  "level": string;
}
export interface LolRewardTrackRMSPayload {
  "productId": string;
  "affinities": string[];
}
export interface LolRewardTrackRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolRewardTrackRepeat {
  "count": number;
  "scope": number;
  "multiplier": number;
  "milestones": LolRewardTrackMilestone[];
  "repeatTriggers": LolRewardTrackRepeatGroupTrigger[];
}
export interface LolRewardTrackRepeatGroupTrigger {
  "type": string;
  "counterId": string;
  "startTriggerValue": number;
  "increaseBy": number;
  "multiplier": number;
}
export interface LolRewardTrackRequestDTO_SelectionRequestDTO {
  "data": LolRewardTrackSelectionRequestDTO;
  "metadata": LolRewardTrackRequestMetadataDTO;
}
export interface LolRewardTrackRequestDTO_vector_SelectionRequestDTO {
  "data": LolRewardTrackSelectionRequestDTO[];
  "metadata": LolRewardTrackRequestMetadataDTO;
}
export interface LolRewardTrackRequestDTO_vector_string {
  "data": string[];
  "metadata": LolRewardTrackRequestMetadataDTO;
}
export interface LolRewardTrackRequestMetadataDTO {
  "transactionId"?: string;
}
export interface LolRewardTrackResponseDTO_SvcRewardGrant {
  "data": LolRewardTrackSvcRewardGrant;
  "metadata": LolRewardTrackResponseMetadataDTO;
}
export interface LolRewardTrackResponseDTO_map_RewardGroupId_SelectGrantStatus {
  "data": Record<string, LolRewardTrackSelectGrantStatusResponse>;
  "metadata": LolRewardTrackResponseMetadataDTO;
}
export interface LolRewardTrackResponseDTO_vector_SvcRewardGrant {
  "data": LolRewardTrackSvcRewardGrant[];
  "metadata": LolRewardTrackResponseMetadataDTO;
}
export interface LolRewardTrackResponseDTO_vector_SvcRewardGroup {
  "data": LolRewardTrackSvcRewardGroup[];
  "metadata": LolRewardTrackResponseMetadataDTO;
}
export interface LolRewardTrackResponseMetadataDTO {
}
export interface LolRewardTrackReward {
  "id": string;
  "itemId": string;
  "itemType": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolRewardTrackRewardGrant {
  "info": LolRewardTrackSvcRewardGrant;
  "rewardGroup": LolRewardTrackSvcRewardGroup;
}
export type LolRewardTrackRewardStatus = "FAILED" | "FULFILLED" | "PENDING";
export type LolRewardTrackRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolRewardTrackRewardTrackError {
  "errorMessage": string;
  "errorId": string;
}
export interface LolRewardTrackRewardTrackItem {
  "state": LolRewardTrackRewardTrackItemStates;
  "rewardOptions": LolRewardTrackRewardTrackItemOption[];
  "rewardTags": LolRewardTrackRewardTrackItemTag[];
  "progressRequired": number;
  "threshold": string;
}
export type LolRewardTrackRewardTrackItemHeaderType = "FREE" | "NONE" | "PREMIUM";
export interface LolRewardTrackRewardTrackItemOption {
  "state": LolRewardTrackRewardTrackItemStates;
  "thumbIconPath": string;
  "splashImagePath": string;
  "selected": boolean;
  "overrideFooter": string;
  "headerType": LolRewardTrackRewardTrackItemHeaderType;
  "rewardName": string;
  "rewardDescription": string;
  "rewardItemType": string;
  "rewardItemId": string;
  "rewardFulfillmentSource": string;
  "cardSize": string;
  "rewardGroupId": string;
  "celebrationType": LolRewardTrackCelebrationType;
  "rewardInventoryTypes": string[];
}
export type LolRewardTrackRewardTrackItemStates = "Locked" | "Selected" | "Unlocked" | "Unselected";
export type LolRewardTrackRewardTrackItemTag = "Choice" | "Free" | "Instant" | "Multiple" | "Rare";
export interface LolRewardTrackRewardTrackProgress {
  "level": number;
  "totalLevels": number;
  "levelProgress": number;
  "futureLevelProgress": number;
  "passProgress": number;
  "currentLevelXP": number;
  "totalLevelXP": number;
  "iteration": number;
}
export interface LolRewardTrackRewardTrackXP {
  "currentLevel": number;
  "currentLevelXP": number;
  "totalLevelXP": number;
  "isBonusPhase": boolean;
  "iteration": number;
}
export interface LolRewardTrackRewardsCatalogPluginItem {
  "itemId": number;
  "name": string;
  "itemInstanceId": string;
  "owned": boolean;
  "rarity": string;
  "active": boolean;
  "questSkinInfo": LolRewardTrackRewardsSkinLineInfo;
}
export interface LolRewardTrackRewardsCatalogPluginItemAssets {
  "splashPath": string;
  "loadScreenPath": string;
}
export interface LolRewardTrackRewardsCatalogPluginItemWithDetails {
  "item": LolRewardTrackRewardsCatalogPluginItem;
  "assets": LolRewardTrackRewardsCatalogPluginItemAssets;
}
export interface LolRewardTrackRewardsConfig {
  "GrantFiltering": boolean;
}
export interface LolRewardTrackRewardsSkinLineInfo {
  "tiers": LolRewardTrackRewardsSkinLineTier[];
  "mostProgressedSkinTier": LolRewardTrackRewardsSkinLineTier;
  "productType": string;
}
export interface LolRewardTrackRewardsSkinLineTier {
  "stage": number;
  "name": string;
  "uncenteredSplashPath": string;
  "ownership": LolRewardTrackRewardsSkinLineTierOwnership;
}
export interface LolRewardTrackRewardsSkinLineTierOwnership {
  "owned": boolean;
}
export type LolRewardTrackSelectGrantStatusResponse = "FAILED" | "SELECTED";
export interface LolRewardTrackSelectionRequestDTO {
  "grantId": string;
  "rewardGroupId": string;
  "selections": string[];
}
export interface LolRewardTrackSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolRewardTrackSvcRewardGrant {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "dateCreated": string;
  "status": LolRewardTrackGrantStatus;
  "grantElements": LolRewardTrackSvcRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
  "grantorDescription": LolRewardTrackGrantorDescription;
  "messageParameters": Record<string, unknown>;
}
export interface LolRewardTrackSvcRewardGrantElement {
  "elementId": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "status": LolRewardTrackRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolRewardTrackSvcRewardGroup {
  "id": string;
  "productId": string;
  "types": string[];
  "rewards": LolRewardTrackReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolRewardTrackRewardStrategy;
  "selectionStrategyConfig"?: LolRewardTrackSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
  "celebrationType": LolRewardTrackCelebrationType;
}
export interface LolRewardTrackTrackProgressNextReward {
  "currentXP": number;
  "nextLevelXP": number;
  "currentLevel": number;
  "nextReward": LolRewardTrackNextRewardUIData;
}
export interface LolRewardTrackTrigger {
  "type": string;
  "counterId": string;
  "entitlementItemId": string;
  "triggerValue": number;
}
export interface LolRewardTrackUnclaimedRewardsUIData {
  "rewardsCount": number;
  "lockedTokensCount": number;
  "timeOfLastUnclaimedReward": number;
}
export type LolRewardsCelebrationType = "FULLSCREEN" | "NONE" | "TOAST";
export interface LolRewardsFSC {
  "id": string;
  "canvas": LolRewardsFSCCanvas;
  "media": LolRewardsFSCMedia;
  "rewards": LolRewardsFSCRewards[];
}
export interface LolRewardsFSCCanvas {
  "title": string;
  "subtitle": string;
  "description": string;
  "canvasBackgroundImage": string;
  "canvasSize": LolRewardsFSCCanvasSize;
  "canvasDesign": string;
  "buttonText": string;
}
export type LolRewardsFSCCanvasSize = "FULL" | "LARGE" | "MEDIUM" | "SMALL";
export interface LolRewardsFSCMedia {
  "introAnimation": string;
  "introAnimationAudio": string;
  "introLowSpecImage": string;
  "loopAnimation": string;
  "loopAnimationAudio": string;
  "transitionAnimation": string;
  "transitionAnimationAudio": string;
}
export interface LolRewardsFSCRewards {
  "itemId": number;
  "image": string;
  "imageOverlay": string;
  "title": string;
  "subtitle": string;
}
export type LolRewardsGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolRewardsGrantorDescription {
  "appName": string;
  "entityId": string;
}
export interface LolRewardsRMSPayload {
  "productId": string;
  "affinities": string[];
}
export interface LolRewardsRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolRewardsRequestDTO_SelectionRequestDTO {
  "data": LolRewardsSelectionRequestDTO;
  "metadata": LolRewardsRequestMetadataDTO;
}
export interface LolRewardsRequestDTO_vector_SelectionRequestDTO {
  "data": LolRewardsSelectionRequestDTO[];
  "metadata": LolRewardsRequestMetadataDTO;
}
export interface LolRewardsRequestDTO_vector_string {
  "data": string[];
  "metadata": LolRewardsRequestMetadataDTO;
}
export interface LolRewardsRequestMetadataDTO {
  "transactionId"?: string;
}
export interface LolRewardsResponseDTO_SvcRewardGrant {
  "data": LolRewardsSvcRewardGrant;
  "metadata": LolRewardsResponseMetadataDTO;
}
export interface LolRewardsResponseDTO_map_RewardGroupId_SelectGrantStatus {
  "data": Record<string, LolRewardsSelectGrantStatusResponse>;
  "metadata": LolRewardsResponseMetadataDTO;
}
export interface LolRewardsResponseDTO_vector_SvcRewardGrant {
  "data": LolRewardsSvcRewardGrant[];
  "metadata": LolRewardsResponseMetadataDTO;
}
export interface LolRewardsResponseDTO_vector_SvcRewardGroup {
  "data": LolRewardsSvcRewardGroup[];
  "metadata": LolRewardsResponseMetadataDTO;
}
export interface LolRewardsResponseMetadataDTO {
}
export interface LolRewardsReward {
  "id": string;
  "itemId": string;
  "itemType": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolRewardsRewardGrant {
  "info": LolRewardsSvcRewardGrant;
  "rewardGroup": LolRewardsSvcRewardGroup;
}
export type LolRewardsRewardStatus = "FAILED" | "FULFILLED" | "PENDING";
export type LolRewardsRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolRewardsRewardsCatalogPluginItem {
  "itemId": number;
  "name": string;
  "itemInstanceId": string;
  "owned": boolean;
  "rarity": string;
  "active": boolean;
  "questSkinInfo": LolRewardsRewardsSkinLineInfo;
}
export interface LolRewardsRewardsCatalogPluginItemAssets {
  "splashPath": string;
  "loadScreenPath": string;
}
export interface LolRewardsRewardsCatalogPluginItemWithDetails {
  "item": LolRewardsRewardsCatalogPluginItem;
  "assets": LolRewardsRewardsCatalogPluginItemAssets;
}
export interface LolRewardsRewardsConfig {
  "GrantFiltering": boolean;
}
export interface LolRewardsRewardsSkinLineInfo {
  "tiers": LolRewardsRewardsSkinLineTier[];
  "mostProgressedSkinTier": LolRewardsRewardsSkinLineTier;
  "productType": string;
}
export interface LolRewardsRewardsSkinLineTier {
  "stage": number;
  "name": string;
  "uncenteredSplashPath": string;
  "ownership": LolRewardsRewardsSkinLineTierOwnership;
}
export interface LolRewardsRewardsSkinLineTierOwnership {
  "owned": boolean;
}
export type LolRewardsSelectGrantStatusResponse = "FAILED" | "SELECTED";
export interface LolRewardsSelectionRequestDTO {
  "grantId": string;
  "rewardGroupId": string;
  "selections": string[];
}
export interface LolRewardsSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolRewardsSvcRewardGrant {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "dateCreated": string;
  "status": LolRewardsGrantStatus;
  "grantElements": LolRewardsSvcRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
  "grantorDescription": LolRewardsGrantorDescription;
  "messageParameters": Record<string, unknown>;
}
export interface LolRewardsSvcRewardGrantElement {
  "elementId": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "status": LolRewardsRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolRewardsSvcRewardGroup {
  "id": string;
  "productId": string;
  "types": string[];
  "rewards": LolRewardsReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolRewardsRewardStrategy;
  "selectionStrategyConfig"?: LolRewardsSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
  "celebrationType": LolRewardsCelebrationType;
}
export interface LolRiotMessagingServiceChampionMasteryLevelUp {
  "id": number;
  "puuid": string;
  "championId": number;
  "hasLeveledUp": boolean;
  "championLevel": number;
}
export type LolRiotMessagingServiceGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolRiotMessagingServiceGameflowSession {
  "phase": LolRiotMessagingServiceGameflowPhase;
}
export interface LolRiotclientUpgraderGameflowAvailability {
  "isAvailable": boolean;
  "state": string;
}
export interface LolRsoAuthAccessToken {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolRsoAuthAuthError {
  "error": string;
  "errorDescription": string;
}
export interface LolRsoAuthAuthorization {
  "currentPlatformId": string;
  "currentAccountId": number;
  "subject": string;
}
export interface LolRsoAuthAuthorizationRequest {
  "scope": string[];
  "trustLevels": LolRsoAuthRSOAuthorizationTrustLevel[];
  "clientId": string;
  "claims": string[];
}
export interface LolRsoAuthAuthorizationResponse {
  "type": string;
  "authorization": LolRsoAuthImplicitAuthorization;
  "country": string;
}
export type LolRsoAuthConfigReadinessEnum = "Disabled" | "NotReady" | "Ready";
export interface LolRsoAuthConfigStatus {
  "readiness": LolRsoAuthConfigReadinessEnum;
}
export type LolRsoAuthConfigType = "player" | "public";
export interface LolRsoAuthDeviceId {
  "collectorServerName": string;
  "merchantId": string;
  "sessionId": string;
  "installId": string;
  "frameUrl": string;
}
export interface LolRsoAuthEntitlementsToken {
  "token": string;
  "entitlements": string[];
  "expiry": number;
}
export interface LolRsoAuthIdToken {
  "token": string;
  "expiry": number;
}
export interface LolRsoAuthImplicitAuthorization {
  "accessToken": LolRsoAuthAccessToken;
  "idToken": LolRsoAuthIdToken;
}
export interface LolRsoAuthPublicClientConfig {
  "url": string;
  "clientId": string;
}
export type LolRsoAuthRSOAuthorizationTrustLevel = "always_trusted" | "always_verify" | "trusted_device";
export interface LolRsoAuthRSOConfigReadyState {
  "ready": boolean;
}
export interface LolRsoAuthRSOJWTConfig {
  "token"?: string;
}
export interface LolRsoAuthRSOPlayerCredentials {
  "username": string;
  "password": string;
  "platformId": string;
}
export interface LolRsoAuthRegionStatus {
  "platformId": string;
  "enabled": boolean;
  "isLQFallbackAllowed": boolean;
  "isUserInfoEnabled": boolean;
}
export interface LolRsoAuthSessionResponse {
  "type": string;
  "error": string;
}
export interface LolRsoAuthUserInfo {
  "userInfo": string;
}
export interface LolSanctumBannerOddsInfo {
  "bannerId": string;
  "sTierRewards": LolSanctumSanctumTierDrops;
  "aTierRewards": LolSanctumSanctumTierDrops;
  "bTierRewards": LolSanctumSanctumTierDrops;
  "nodeIdToDropDetailsMap": Record<string, LolSanctumSanctumDropDetails>;
}
export interface LolSanctumBannerStoreDisplayMetadata {
  "startDate": string;
  "endDate": string;
  "sanctum": LolSanctumSanctumMetadataDetails;
}
export interface LolSanctumCapCounterData {
  "amount": number;
  "version": number;
  "active": boolean;
  "lastModifiedDate": string;
}
export interface LolSanctumGameDataBannerSkin {
  "id": number;
  "name": string;
  "rarity": string;
}
export interface LolSanctumGameDataPityCounter {
  "id": string;
  "name": string;
}
export interface LolSanctumGameDataSanctumBanner {
  "id": string;
  "chasePityCounter": LolSanctumGameDataPityCounter;
  "chasePityThreshold": number;
  "highlightPityThreshold": number;
  "bannerBackgroundTexture": string;
  "bannerBackgroundParallax": string;
  "bannerChaseAnimationWebmPath": string;
  "bannerChaseAnimationParallax": string;
  "rollVignetteSkinIntroWebmPath": string;
  "rollVignetteSkinIntroSfxPath": string;
  "chaseCelebrationIntroWebmPath": string;
  "chaseCelebrationVo": LolSanctumGameDataSanctumBannerVo;
  "hubIntroVo": LolSanctumGameDataSanctumBannerVo;
  "rollVignette": LolSanctumSanctumVignette;
  "bannerSkin": LolSanctumGameDataBannerSkin;
  "bannerCurrency": LolSanctumGameDataSanctumCurrency;
}
export interface LolSanctumGameDataSanctumBannerVo {
  "path": string;
  "defaultDelayMillis": number;
  "localeOverrides": LolSanctumGameDataSanctumBannerVoOverrideOptions[];
}
export interface LolSanctumGameDataSanctumBannerVoOverrideOptions {
  "locale": string;
  "delayMillis": number;
}
export interface LolSanctumGameDataSanctumCurrency {
  "id": string;
  "name": string;
  "currencyId": string;
  "capCatalogEntryId": string;
}
export interface LolSanctumGipItem {
  "gipItemId": number;
}
export interface LolSanctumSanctumBannerResponse {
  "id": string;
  "bannerBackgroundTexture": string;
  "bannerBackgroundParallax": string;
  "bannerChaseAnimationWebmPath": string;
  "bannerChaseAnimationParallax": string;
  "chasePityCounter": LolSanctumGameDataPityCounter;
  "chasePityThreshold": number;
  "highlightPityThreshold": number;
  "skinIntroAnimationPath": string;
  "skinIntroSfxPath": string;
  "chaseCelebrationIntroAnimationPath": string;
  "chaseCelebrationVo": LolSanctumGameDataSanctumBannerVo;
  "hubIntroVo": LolSanctumGameDataSanctumBannerVo;
  "sanctumRollVideos": LolSanctumSanctumVignette;
  "bannerSkin": LolSanctumGameDataBannerSkin;
  "bannerCurrency": LolSanctumGameDataSanctumCurrency;
  "capCatalogStoreId": string;
  "dropTableCatalogEntryId": string;
  "pityCounter": LolSanctumCapCounterData;
  "startDate": number;
  "endDate": number;
}
export interface LolSanctumSanctumCatalogPurchaseRequest {
  "bannerId": string;
  "storeId": string;
  "catalogEntryId": string;
  "quantity": number;
  "paymentOptions": string[];
  "customInventoryLocation": string;
}
export interface LolSanctumSanctumDropDetails {
  "odds": number;
  "itemInstanceId": string;
  "nodeId": string;
  "type": string;
  "parentId": string;
  "tier": number;
  "isChaseItem": boolean;
  "quantity": number;
  "bundledCurrencyNodeIds": string[];
  "bundleParentNodeId": string;
}
export interface LolSanctumSanctumMetadataDetails {
  "bannerId": string;
}
export interface LolSanctumSanctumPurchaseRequest {
  "bannerId": string;
  "quantity": number;
}
export interface LolSanctumSanctumPurchaseResponse {
  "id": string;
  "status": LolSanctumSanctumPurchaseResponseStatus;
  "rollResultNodeIds": string[];
}
export type LolSanctumSanctumPurchaseResponseStatus = "Failure" | "None" | "Pending" | "Success";
export interface LolSanctumSanctumTierDrops {
  "tier": number;
  "odds": number;
  "mainDrops": LolSanctumSanctumDropDetails[];
  "fallbackDrops": LolSanctumSanctumDropDetails[];
}
export interface LolSanctumSanctumVignette {
  "introTierOneWebmPath": string;
  "introTierOneMultiWebmPath": string;
  "introTierTwoWebmPath": string;
  "introTierTwoMultiWebmPath": string;
  "introTierThreeWebmPath": string;
  "introTierThreeMultiWebmPath": string;
}
export interface LolSanctumSetSelectedBannerIdRequest {
  "bannerId": string;
}
export interface LolSeasonsAllProductSeasonQuery {
  "lastNYears": number;
}
export interface LolSeasonsAllSeasonsProduct {
  "seasonId": number;
  "seasonStart": number;
  "seasonEnd": number;
  "act": boolean;
  "metadata": LolSeasonsSeasonMetaData;
}
export interface LolSeasonsSeasonMetaData {
  "year": number;
  "locKey": string;
  "publicName": string;
  "currentSplit": number;
  "totalSplit": number;
}
export interface LolServiceStatusLegacyServiceStatusMessage {
  "created_at": string;
  "updated_at": string;
  "severity": string;
  "heading": string;
  "content": string;
  "translations": LolServiceStatusLegacyServiceStatusTranslation[];
}
export interface LolServiceStatusLegacyServiceStatusResponse {
  "status": string;
  "messages": LolServiceStatusLegacyServiceStatusMessage[];
}
export interface LolServiceStatusLegacyServiceStatusTranslation {
  "locale": string;
  "heading"?: string;
  "content"?: string;
}
export interface LolServiceStatusRegionLocaleResource {
  "region": string;
  "locale": string;
}
export interface LolServiceStatusRiotStatusIncident {
  "id": number;
  "archive_at"?: string;
  "incident_severity": string;
  "titles": LolServiceStatusRiotStatusTitle[];
  "platforms": string[];
  "updated_at"?: string;
  "created_at": string;
  "updates": LolServiceStatusRiotStatusUpdate[];
}
export interface LolServiceStatusRiotStatusMaintenance {
  "id": number;
  "archive_at"?: string;
  "updates": LolServiceStatusRiotStatusUpdate[];
  "created_at": string;
  "platforms": string[];
  "updated_at"?: string;
  "maintenance_status": string;
  "titles": LolServiceStatusRiotStatusTitle[];
}
export interface LolServiceStatusRiotStatusResource {
  "id": string;
  "name": string;
  "locales": string[];
  "maintenances": LolServiceStatusRiotStatusMaintenance[];
  "incidents": LolServiceStatusRiotStatusIncident[];
}
export interface LolServiceStatusRiotStatusTitle {
  "locale": string;
  "content": string;
}
export interface LolServiceStatusRiotStatusTranslation {
  "locale": string;
  "content": string;
}
export interface LolServiceStatusRiotStatusUpdate {
  "id": number;
  "updated_at"?: string;
  "publish": boolean;
  "author": string;
  "created_at": string;
  "translations": LolServiceStatusRiotStatusTranslation[];
  "publish_locations": string[];
}
export interface LolServiceStatusServiceStatusResource {
  "status": string;
  "humanReadableUrl": string;
}
export interface LolServiceStatusTickerMessage {
  "severity": string;
  "createdAt": string;
  "updatedAt": string;
  "heading": string;
  "message": string;
}
export interface LolSettingsHoneyfruitVNGPublisherSettings {
  "visible": boolean;
}
export interface LolSettingsLCUGameSettingsConfig {
  "HotkeysEnabled": boolean;
  "SoundEnabled": boolean;
  "InterfaceEnabled": boolean;
  "GameplayEnabled": boolean;
}
export interface LolSettingsLoginSession {
  "state": LolSettingsLoginSessionStates;
  "summonerId": number;
  "accountId": number;
}
export type LolSettingsLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export type LolSettingsPublisher = "garena" | "riot" | "tencent" | "twm" | "vng";
export interface LolSettingsRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolSettingsSettingCategory {
  "schemaVersion": number;
  "data": unknown;
}
export interface LolSettingsSettingsConfig {
  "isHotkeysEnabled": boolean;
  "isSoundEnabled": boolean;
  "isInterfaceEnabled": boolean;
  "isGameplayEnabled": boolean;
  "isReplaysEnabled": boolean;
  "isPrivacyNoticeEnabled": boolean;
  "isTermsEnabled": boolean;
  "isLegalStatementsEnabled": boolean;
  "localizedLicensesURL": string;
}
export interface LolSettingsVNGStatusResponse {
  "action_required": boolean;
  "action_url": string;
  "action_url_raw": string;
}
export interface LolShoppefrontBulkPurchaseRequest {
  "purchaseItems": LolShoppefrontPurchaseRequest[];
  "purchaseTimeOut": number;
}
export interface LolShoppefrontPurchaseRequest {
  "storeId": string;
  "catalogEntryId": string;
  "quantity": number;
  "paymentOptions": string[];
  "purchaseTimeOut": number;
}
export interface LolShoppefrontPurchaseResponse {
  "id": string;
  "status": LolShoppefrontPurchaseResponseStatus;
  "numberOfPendingPurchases": number;
  "rollResults": ChemtechShoppeV2_RolledFulfillmentWrapperDto[];
}
export type LolShoppefrontPurchaseResponseStatus = "Failure" | "None" | "Pending" | "Success";
export interface LolShutdownAuthorization {
  "currentPlatformId": string;
}
export interface LolShutdownSessionRMSNotification {
  "product": string;
  "region": string;
  "serviceState": string;
}
export interface LolShutdownShutdownNotification {
  "reason": LolShutdownShutdownReason;
  "countdown": number;
  "additionalInfo": string;
}
export type LolShutdownShutdownReason = "Invalid" | "LcuAlphaDisabled" | "PlatformMaintenance" | "PlayerBanned";
export type LolSimpleDialogMessagesGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolSimpleDialogMessagesGameflowSession {
  "phase": LolSimpleDialogMessagesGameflowPhase;
}
export interface LolSimpleDialogMessagesLocalMessageRequest {
  "msgType": string;
  "msgBody": string[];
}
export interface LolSimpleDialogMessagesMessage {
  "id": number;
  "type": string;
  "body": unknown;
}
export interface LolSimpleDialogMessagesSimpleMessage {
  "accountId": number;
  "msgId": string;
  "type": string;
  "params": string[];
}
export interface LolSocialLeaderboardFriendResource {
  "summonerId": number;
  "name": string;
  "gameName": string;
  "gameTag": string;
  "puuid": string;
  "icon": number;
  "availability": string;
}
export interface LolSocialLeaderboardGiftingFriend {
  "summonerId": number;
}
export type LolSocialLeaderboardLeagueDivision = "I" | "II" | "III" | "IV" | "NA" | "V";
export type LolSocialLeaderboardLeagueQueueType = "JADE_RANKED_SOLO_5x5" | "NONE" | "RANKED_FLEX_SR" | "RANKED_FLEX_TT" | "RANKED_PREMADE_5x5" | "RANKED_SOLO_5x5" | "RANKED_TFT" | "RANKED_TFT_DOUBLE_UP" | "RANKED_TFT_PAIRS" | "RANKED_TFT_TURBO";
export type LolSocialLeaderboardLeagueTierNumValue = "BRONZE" | "CHALLENGER" | "DIAMOND" | "EMERALD" | "GOLD" | "GRANDMASTER" | "IRON" | "MASTER" | "NONE" | "PLATINUM" | "SILVER";
export interface LolSocialLeaderboardRankedQueueStats {
  "queueType": LolSocialLeaderboardLeagueQueueType;
  "provisionalGamesRemaining": number;
  "isProvisional": boolean;
  "tier": string;
  "division": LolSocialLeaderboardLeagueDivision;
  "leaguePoints": number;
  "wins": number;
}
export interface LolSocialLeaderboardRankedStats {
  "queueMap": Record<string, LolSocialLeaderboardRankedQueueStats>;
}
export interface LolSocialLeaderboardSocialLeaderboardData {
  "rowData": LolSocialLeaderboardSocialLeaderboardRowData[];
  "nextUpdateTime": number;
}
export interface LolSocialLeaderboardSocialLeaderboardRowData {
  "puuid": string;
  "summonerId": number;
  "summonerName": string;
  "gameName": string;
  "tagLine": string;
  "provisionalGamesRemaining": number;
  "isProvisional": boolean;
  "tier": string;
  "division": LolSocialLeaderboardLeagueDivision;
  "leaguePoints": number;
  "wins": number;
  "summonerLevel": number;
  "profileIconId": number;
  "availability": string;
  "leaderboardPosition": number;
  "isGiftable": boolean;
}
export interface LolSocialLeaderboardSummoner {
  "summonerId": number;
  "accountId": number;
  "displayName": string;
  "internalName": string;
  "gameName": string;
  "tagLine": string;
  "summonerLevel": number;
  "puuid": string;
  "profileIconId": number;
}
export interface LolSpectatorQueue {
  "spectatorEnabled": boolean;
  "id": number;
}
export interface LolSpectatorSpectateAvailabilityResponseDto {
  "availableForWatching": string[];
}
export interface LolSpectatorSpectateAvailabilityResponseDtoV2 {
  "availableForWatching": number[];
}
export interface LolSpectatorSpectateAvailabilityResponseDtoV3 {
  "availableForWatching": string[];
}
export interface LolSpectatorSpectateGameInfo {
  "dropInSpectateGameId": string;
  "gameQueueType": string;
  "allowObserveMode": string;
  "puuid": string;
  "spectatorKey": string;
}
export interface LolSpectatorSpectateResource {
  "availableForWatching": string[];
}
export interface LolSpectatorSpectatorConfig {
  "isEnabled": boolean;
  "isSpectatorDelayConfigurable": boolean;
  "isBracketSpectatingEnabled": boolean;
  "isUsingClientConfigForSpectator": boolean;
  "spectatableQueues": number[];
}
export interface LolSpectatorSpectatorDynamicConfiguration {
  "isEnabled": boolean;
  "isSpectatorDelayConfigurable": boolean;
  "isUsingOperationalConfig": boolean;
}
export interface LolSpectatorSpectatorKeySpectateResource {
  "availableForWatching": boolean;
  "reason": string;
}
export interface LolSpectatorSpectatorOperationalConfiguration {
  "enabled": boolean;
  "enforceGridSpectating": boolean;
}
export interface LolSpectatorSummonerIdAvailability {
  "availableForWatching": number[];
}
export interface LolSpectatorSummonerOrTeamAvailabilty {
  "availableForWatching": string[];
}
export interface LolSpectatorSummonerPuuidsSpectateResource {
  "availableForWatching": string[];
}
export interface LolStatstonesCatalogBundle {
  "item": LolStatstonesCatalogItemDetails;
}
export interface LolStatstonesCatalogBundlePrice {
  "currency": string;
  "cost": number;
}
export interface LolStatstonesCatalogItemDetails {
  "itemId": number;
  "inventoryType": string;
  "subInventoryType": string;
  "prices": LolStatstonesCatalogBundlePrice[];
  "releaseDate": string;
  "itemInstanceId": string;
}
export interface LolStatstonesChampionStatstoneSetSummary {
  "name": string;
  "stonesAvailable": number;
  "stonesOwned": number;
  "stonesIlluminated": number;
  "milestonesPassed": number;
}
export interface LolStatstonesChampionStatstoneSummary {
  "championId": number;
  "stonesAvailable": number;
  "stonesOwned": number;
  "stonesIlluminated": number;
  "milestonesPassed": number;
  "sets": LolStatstonesChampionStatstoneSetSummary[];
}
export interface LolStatstonesCollectionsChampion {
  "name": string;
  "squarePortraitPath": string;
  "id": number;
}
export interface LolStatstonesEogNotificationEnvelope {
  "selfStatstoneProgress": LolStatstonesStatstoneProgress[];
  "selfPersonalBests": LolStatstonesPersonalBestNotification[];
  "selfMilestoneProgress": LolStatstonesMilestoneProgressNotification[];
  "othersPersonalBests": LolStatstonesPersonalBestNotification[];
}
export interface LolStatstonesGameDataItemReference {
  "itemId": number;
  "inventoryType": string;
  "contentId": string;
}
export interface LolStatstonesGameDataStatstone {
  "name": string;
  "contentId": string;
  "itemId": number;
  "trackingType": number;
  "isRetired": boolean;
  "isEpic": boolean;
  "boundChampion": LolStatstonesGameDataItemReference;
  "milestones": number[];
  "category": string;
  "description": string;
  "iconUnowned": string;
  "iconUnlit": string;
  "iconLit": string;
  "iconFull": string;
}
export interface LolStatstonesGameDataStatstonePack {
  "name": string;
  "description": string;
  "contentId": string;
  "itemId": number;
}
export interface LolStatstonesGameDataStatstoneSet {
  "name": string;
  "itemId": number;
  "inventoryType": string;
  "contentId": string;
  "statstones": LolStatstonesGameDataStatstone[];
  "price": number;
}
export interface LolStatstonesGameDataStatstonesInfo {
  "statstoneData": LolStatstonesGameDataStatstoneSet[];
  "packData": LolStatstonesGameDataStatstonePack[];
  "packIdToStatStonesIds": unknown;
  "seriesIdToStatStoneIds": unknown;
  "packIdToSubPackIds": unknown;
  "collectionIdToStatStoneIds": unknown;
  "packIdToChampIds": unknown;
  "champIdToPackIds": unknown;
}
export interface LolStatstonesLoadout {
  "id": string;
  "name": string;
  "scope": string;
  "itemId": number;
  "loadout": Record<string, unknown>;
}
export interface LolStatstonesLoadoutItem {
  "inventoryType": string;
  "contentId": string;
  "itemId": number;
}
export interface LolStatstonesMilestoneNotificationDto {
  "statstoneId": string;
  "level": number;
  "threshold": number;
  "isCompleted": boolean;
}
export interface LolStatstonesMilestoneProgressNotification {
  "statstoneId": string;
  "statstoneName": string;
  "threshold": number;
  "imageUrl": string;
  "level": string;
}
export interface LolStatstonesNumberFormattingBehavior {
  "digitsForThousandsSeperator": number;
  "trimTrailingZerosAfterDecimal": boolean;
  "westernNumberGrouping": boolean;
}
export interface LolStatstonesNumberFormattingData {
  "decimalSeperator": string;
  "thousandSeperator": string;
  "thousandAbbreviation": string;
  "tenThousandAbbreviation": string;
  "millionAbbreviation": string;
  "oneHundredMillionAbbreviation": string;
  "billionAbbreviation": string;
  "trillionAbbreviation": string;
  "secondAbbreviation": string;
  "minuteAbbreviation": string;
  "hourAbbreviation": string;
  "metersAbbreviation": string;
  "kilometersAbbreviation": string;
  "percentageFormat": string;
  "numberFormattingBehavior": LolStatstonesNumberFormattingBehavior;
}
export interface LolStatstonesPersonalBestNotification {
  "summoner": LolStatstonesSummoner;
  "statstoneId": string;
  "statstoneName": string;
  "personalBest": string;
  "imageUrl": string;
}
export interface LolStatstonesPriceInfo {
  "currency": string;
  "price": number;
}
export interface LolStatstonesProfileStatstoneSummary {
  "championId": number;
  "name": string;
  "value": string;
  "imageUrl": string;
  "category": string;
}
export interface LolStatstonesStatstone {
  "name": string;
  "statstoneId": string;
  "boundChampionItemId": number;
  "nextMilestone": string;
  "completionValue": number;
  "isComplete": boolean;
  "isFeatured": boolean;
  "isEpic": boolean;
  "isRetired": boolean;
  "category": string;
  "imageUrl": string;
  "description": string;
  "formattedValue": string;
  "formattedPersonalBest": string;
  "formattedMilestoneLevel": string;
  "playerRecord"?: LolStatstonesStatstonePlayerRecord;
}
export interface LolStatstonesStatstoneCompletion {
  "statstoneName": string;
  "category": string;
  "isEpic": boolean;
}
export interface LolStatstonesStatstoneFeaturedRequest {
  "index": number;
  "existingFeatured": LolStatstonesStatstone[];
}
export interface LolStatstonesStatstoneMasteryVignette {
  "numSetsCompleted": number;
  "masteryLevel": number;
  "completedSetUuids": string[];
  "puuid": string;
}
export interface LolStatstonesStatstoneNotificationDto {
  "statstoneId": string;
  "puuid": string;
  "delta": number;
  "value": number;
  "level": number;
  "best": number;
  "isNewBest": boolean;
}
export interface LolStatstonesStatstoneNotificationEnvelopeDto {
  "gameId": number;
  "updates": LolStatstonesStatstoneNotificationDto[];
  "milestones": LolStatstonesMilestoneNotificationDto[];
}
export interface LolStatstonesStatstonePlayerRecord {
  "puuid": string;
  "statstoneId": string;
  "value": number;
  "personalBest": number;
  "milestoneLevel": number;
  "dateAcquired": string;
  "dateModified": string;
  "dateCompleted": string;
  "dateArchived": string;
  "entitled": boolean;
}
export interface LolStatstonesStatstoneProgress {
  "statstoneId": string;
  "statstoneName": string;
  "description": string;
  "imageUrl": string;
  "delta": string;
  "value": string;
  "nextMilestone": string;
  "existingProgressPercent": string;
  "newProgressPercent": string;
  "newMilestoneDifference": string;
  "totalProgressPercent": string;
  "category": string;
  "level": number;
  "best": number;
  "isNewBest": boolean;
}
export interface LolStatstonesStatstoneRekindledVignette {
  "portraitPath": string;
  "statstone": LolStatstonesStatstoneCompletion;
}
export interface LolStatstonesStatstoneSet {
  "name": string;
  "statstones": LolStatstonesStatstone[];
  "stonesOwned": number;
  "milestonesPassed": number;
  "itemId": number;
  "inventoryType": string;
  "subInventoryType": string;
  "itemInstanceID": string;
  "prices": LolStatstonesPriceInfo[];
  "ownedFromPacks": LolStatstonesGameDataStatstonePack[];
}
export interface LolStatstonesStatstoneSetCompleteVignette {
  "statstones": LolStatstonesStatstoneCompletion[];
}
export interface LolStatstonesStatstoneVignetteNotificationEnvelopeDto {
  "champName": string;
  "champId": number;
  "masteryVignetteNotifications": LolStatstonesStatstoneMasteryVignette[];
  "rekindledVignetteNotifications": LolStatstonesStatstoneRekindledVignette[];
  "setCompleteVignetteNotifications": LolStatstonesStatstoneSetCompleteVignette[];
}
export interface LolStatstonesSummoner {
  "summonerId": number;
  "puuid": string;
  "displayName": string;
  "summonerLevel": number;
}
export interface LolStoreAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolStoreAliasChangeNotificationResource {
  "id": number;
  "type": string;
  "details": LolStoreAliasDetail;
}
export interface LolStoreAliasDetail {
  "field": string;
  "old_value": string;
  "new_value": string;
}
export interface LolStoreBundleItemDTO {
  "inventoryType": string;
  "itemId": number;
  "iconUrl": string;
  "quantity": number;
  "name": string;
  "description": string;
  "owned": boolean;
  "rp": number;
  "discountedRp": number;
  "ip": number;
}
export interface LolStoreBundled {
  "flexible": boolean;
  "items": LolStoreBundledItem[];
  "minimumPrices": LolStoreBundledItemCost[];
}
export interface LolStoreBundledItem {
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
  "discountPrices": LolStoreBundledItemCost[];
}
export interface LolStoreBundledItemCost {
  "currency": string;
  "cost": number;
  "discount"?: number;
  "costType": string;
}
export interface LolStoreCapOffer {
  "id": string;
  "typeId": string;
  "label": string;
  "productId": string;
  "merchantId": string;
  "payload": unknown;
  "active": boolean;
  "startDate": string;
  "createdDate": string;
}
export interface LolStoreCatalogInstanceToItemKeyMap {
  "platformIds": Record<string, LolStoreItemKey>;
}
export interface LolStoreCatalogItem {
  "itemId": number;
  "inventoryType": string;
  "iconUrl"?: string;
  "localizations"?: Record<string, LolStoreItemLocalization>;
  "active"?: boolean;
  "bundled"?: LolStoreBundled;
  "inactiveDate"?: string;
  "maxQuantity"?: number;
  "prices"?: LolStoreItemCost[];
  "releaseDate"?: string;
  "sale"?: LolStoreSale;
  "duration"?: number;
  "subInventoryType"?: string;
  "tags"?: string[];
  "itemRequirements"?: LolStoreItemKey[];
  "metadata"?: LolStoreItemMetadataEntry[];
  "itemInstanceId"?: string;
  "offerId"?: string;
}
export interface LolStoreFeaturedPageDTO {
  "Player": LolStorePlayer;
}
export interface LolStoreGameDataChampionSkinInfo {
  "id": number;
}
export interface LolStoreGetPlatformIdsFromInstanceIdsRequest {
  "instanceIds": string[];
}
export interface LolStoreGiftableResult {
  "config": LolStoreGiftingConfig;
  "friends": LolStoreGiftingFriend[];
}
export interface LolStoreGiftingConfig {
  "recipientLevelLimitItem": number;
  "recipientLevelLimitRp": number;
  "giftingRestrictionFlagRioter": number;
  "giftingItemMinLevelSend": number;
  "giftingRpMinLevelSend": number;
  "giftingRpMaxDailyGiftsSend": number;
  "giftingRpMaxDailyGiftsReceive": number;
  "giftingItemMaxDailyGiftsSend": number;
  "giftingItemMaxDailyGiftsReceive": number;
  "giftingHextechMaxDailyGiftsSend": number;
  "giftingHextecMaxDailyGiftsReceive": number;
}
export interface LolStoreGiftingFriend {
  "friendsSince": string;
  "oldFriends": boolean;
  "summonerId": number;
  "nick": string;
}
export interface LolStoreItemCost {
  "currency": string;
  "cost": number;
  "discount"?: number;
}
export interface LolStoreItemKey {
  "inventoryType": string;
  "itemId": number;
}
export interface LolStoreItemLocalization {
  "language": string;
  "name": string;
  "description": string;
}
export interface LolStoreItemMetadataEntry {
  "type": string;
  "value": string;
}
export interface LolStoreItemOrderDTO {
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
  "rpCost": number;
}
export interface LolStoreItemSale {
  "id": number;
  "active": boolean;
  "item": LolStoreItemKey;
  "sale": LolStoreSale;
}
export interface LolStoreLoginSession {
  "state": LolStoreLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
}
export type LolStoreLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolStoreNotification {
  "backgroundUrl": string;
  "created": string;
  "critical": boolean;
  "dismissible": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolStoreOrderNotificationResource {
  "id": number;
  "eventTypeId": string;
  "eventType": string;
  "status": string;
}
export interface LolStorePageDTO {
  "Player": LolStorePlayer;
  "catalog": LolStoreCatalogItem[];
  "groupOrder": string[];
  "itemGroups": Record<string, LolStorePageGroupingDTO>;
}
export interface LolStorePageGroupingDTO {
  "items": LolStoreItemKey[];
  "hidden": boolean;
  "grouped": boolean;
}
export interface LolStorePlayer {
  "accountId": number;
  "rp": number;
  "ip": number;
  "summonerLevel": number;
}
export interface LolStorePurchaseOrderRequestDTO {
  "accountId": number;
  "items": LolStoreItemOrderDTO[];
}
export interface LolStorePurchaseOrderResponseDTO {
  "rpBalance": number;
  "ipBalance": number;
  "transactions": LolStoreTransactionResponseDTO[];
}
export interface LolStoreRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolStoreSale {
  "startDate": string;
  "endDate": string;
  "prices": LolStoreItemCost[];
}
export interface LolStoreServiceBalance {
  "currency": string;
  "amount": number;
}
export interface LolStoreServiceWallet {
  "accountId": number;
  "balances": LolStoreServiceBalance[];
}
export interface LolStoreSimpleDialogMessage {
  "accountId": number;
  "msgId": string;
  "type": string;
  "params": string[];
}
export interface LolStoreStoreStatus {
  "storefrontIsRunning": boolean;
}
export interface LolStoreTransactionResponseDTO {
  "id": string;
  "inventoryType": string;
  "itemId": number;
}
export interface LolStoreWallet {
  "ip": number;
  "rp": number;
}
export interface LolSuggestedPlayersEndOfGamePlayer {
  "summonerName": string;
  "summonerId": number;
}
export interface LolSuggestedPlayersEndOfGameStats {
  "teams": LolSuggestedPlayersEndOfGameTeam[];
}
export interface LolSuggestedPlayersEndOfGameTeam {
  "players": LolSuggestedPlayersEndOfGamePlayer[];
  "isWinningTeam": boolean;
}
export type LolSuggestedPlayersGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolSuggestedPlayersHonorInteraction {
  "summonerId": number;
  "displayName": string;
  "gameId": number;
}
export interface LolSuggestedPlayersSuggestedPlayersConfig {
  "Enabled": boolean;
  "FriendsOfFriendsEnabled": boolean;
  "MaxNumSuggestedPlayers": number;
  "MaxNumReplacements": number;
  "PreviousPremadesLimit": number;
  "OnlineFriendsLimit": number;
  "FriendsOfFriendsLimit": number;
  "VicoriousComradesLimit": number;
  "MaxHonorInteractionPlayers": number;
}
export interface LolSuggestedPlayersSuggestedPlayersDynamicClientConfig {
  "SuggestedPlayers": LolSuggestedPlayersSuggestedPlayersConfig;
}
export interface LolSuggestedPlayersSuggestedPlayersFriend {
  "summonerId": number;
  "name": string;
  "availability": string;
  "product": string;
  "relationshipOnRiot": string;
}
export interface LolSuggestedPlayersSuggestedPlayersKudoedPlayer {
  "kudoedSummonerId": number;
  "kudoedSummonerName": string;
}
export interface LolSuggestedPlayersSuggestedPlayersLobbyStatus {
  "queueId": number;
  "memberSummonerIds": number[];
  "invitedSummonerIds": number[];
}
export interface LolSuggestedPlayersSuggestedPlayersPlayerStatus {
  "currentLobbyStatus"?: LolSuggestedPlayersSuggestedPlayersLobbyStatus;
  "lastQueuedLobbyStatus"?: LolSuggestedPlayersSuggestedPlayersLobbyStatus;
}
export interface LolSuggestedPlayersSuggestedPlayersQueue {
  "id": number;
  "minLevel": number;
}
export type LolSuggestedPlayersSuggestedPlayersReason = "FriendOfFriend" | "HonorInteractions" | "LegacyPlayAgain" | "OnlineFriend" | "PreviousPremade" | "VictoriousComrade";
export interface LolSuggestedPlayersSuggestedPlayersReportedPlayer {
  "offenderSummonerId": number;
}
export interface LolSuggestedPlayersSuggestedPlayersSuggestedPlayer {
  "summonerName": string;
  "summonerId": number;
  "commonFriendName": string;
  "commonFriendId": number;
  "reason": LolSuggestedPlayersSuggestedPlayersReason;
  "gameId": number;
}
export interface LolSuggestedPlayersSuggestedPlayersSummoner {
  "summonerId": number;
  "displayName": string;
  "summonerLevel": number;
}
export interface LolSuggestedPlayersSuggestedPlayersVictoriousComrade {
  "summonerId": number;
  "summonerName": string;
}
export interface LolSummonerAccountIdAndSummonerId {
  "accountId": number;
  "summonerId": number;
}
export interface LolSummonerAlias {
  "gameName": string;
  "tagLine": string;
}
export interface LolSummonerAliasAvailability {
  "alias": LolSummonerAlias;
  "errorCode": LolSummonerAliasAvailabilityCode;
  "errorMessage": string;
  "isSuccess": boolean;
}
export type LolSummonerAliasAvailabilityCode = "name_change_forbidden" | "name_not_available" | "no_error" | "rate_limited" | "server_error";
export interface LolSummonerAliasDTO {
  "error": string;
  "providerId": string;
  "puuid": string;
  "gnt": LolSummonerAlias;
  "playstationNameset": LolSummonerConsoleNameset;
  "switchNameset": LolSummonerConsoleNameset;
  "xboxNameset": LolSummonerConsoleNameset;
}
export interface LolSummonerAliasLookupDTO {
  "game_name": string;
  "tag_line": string;
}
export interface LolSummonerAliasLookupResponse {
  "alias": LolSummonerAlias;
  "puuid": string;
}
export interface LolSummonerAliasLookupResponseDTO {
  "alias": LolSummonerAliasLookupDTO;
  "puuid": string;
}
export interface LolSummonerAutoFillQueueDto {
  "queueId": number;
  "autoFillEligible": boolean;
  "autoFillProtectedForStreaking": boolean;
  "autoFillProtectedForPromos": boolean;
  "overridePositionSelectionsWithFill": boolean;
  "autoFillProtectedForRemedy": boolean;
}
export interface LolSummonerConsoleNameset {
  "name": string;
}
export interface LolSummonerGameloopPlayerInfoV2 {
  "autoFillDataBags": LolSummonerAutoFillQueueDto[];
  "rerollDataBags": LolSummonerRerollDataBagForClientV1[];
}
export interface LolSummonerGameloopPlayerInfoV2Response {
  "payload"?: LolSummonerGameloopPlayerInfoV2;
  "status": string;
}
export interface LolSummonerLevelField {
  "initialLevel": number;
  "finalLevel": number;
  "progress": LolSummonerLevelProgression;
}
export interface LolSummonerLevelProgression {
  "initialXp": number;
  "finalXp": number;
  "initialLevelBoundary": number;
  "finalLevelBoundary": number;
}
export interface LolSummonerLoginSession {
  "state": LolSummonerLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "puuid": string;
  "connected": boolean;
}
export type LolSummonerLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolSummonerNamesetsResponse {
  "namesets": LolSummonerAliasDTO[];
}
export type LolSummonerPlayerNameMode = "ALIAS" | "DARKMODE" | "SUMMONER";
export interface LolSummonerPlayerNameState {
  "isAliasChangeRequired": boolean;
  "isAliasMissing": boolean;
  "isTaglineCustomizable": boolean;
}
export interface LolSummonerProfilePrivacy {
  "enabledState": LolSummonerProfilePrivacyEnabledState;
  "setting": LolSummonerProfilePrivacySetting;
}
export type LolSummonerProfilePrivacyEnabledState = "DISABLED" | "ENABLED" | "UNKNOWN";
export type LolSummonerProfilePrivacySetting = "PRIVATE" | "PUBLIC";
export interface LolSummonerProfilesChampionMasteryData {
  "championId": number;
  "championLevel": number;
  "championPoints": number;
  "highestGrade"?: string;
}
export interface LolSummonerProfilesChampionMasteryView {
  "puuid": string;
  "data": LolSummonerProfilesChampionMasteryData[];
}
export interface LolSummonerProfilesHonorView {
  "honorLevel": number;
  "redemptions": LolSummonerProfilesRedemption[];
}
export interface LolSummonerProfilesJadeVotingSelection {
  "questionId": string;
  "votingOptionId": number;
}
export interface LolSummonerProfilesJadeVotingView {
  "votingEventId": string;
  "votingPower"?: number;
  "votingSelections": LolSummonerProfilesJadeVotingSelection[];
}
export interface LolSummonerProfilesLolEosRewardView {
  "seasonId": number;
  "rewardIds": string[];
  "highestRankPerQueueId": Record<string, LolSummonerProfilesRank>;
  "eligibility": LolSummonerProfilesRewardsEligibility;
}
export interface LolSummonerProfilesPositionCount {
  "position": string;
  "games": number;
}
export interface LolSummonerProfilesPrivacyView {
  "anonymityEnabled": boolean;
  "nameOnlyAnonymityEnabled": boolean;
}
export interface LolSummonerProfilesPuuidAndViews {
  "payload": Record<string, LolSummonerProfilesViews>;
}
export interface LolSummonerProfilesQueueRank {
  "tier": string;
  "division": string;
  "leaguePoints": number;
}
export interface LolSummonerProfilesRank {
  "tier": string;
  "division": string;
}
export interface LolSummonerProfilesRankedChampion {
  "championId": number;
  "gameCount": number;
  "winCount": number;
}
export interface LolSummonerProfilesRankedMatch {
  "championId": number;
  "win": boolean;
  "kills": number;
  "deaths": number;
  "assists": number;
}
export interface LolSummonerProfilesRankedScoutingView {
  "puuid": string;
  "summonerIconId": number;
  "soloRank": LolSummonerProfilesQueueRank;
  "flexRank": LolSummonerProfilesQueueRank;
  "topChampions": LolSummonerProfilesRankedChampion[];
  "topMasteries": LolSummonerProfilesChampionMasteryData[];
  "recentMatches": LolSummonerProfilesRankedMatch[];
  "positionStats": LolSummonerProfilesPositionCount[];
}
export interface LolSummonerProfilesRedemption {
  "required": number;
  "remaining": number;
  "eventType": string;
}
export interface LolSummonerProfilesRestriction {
  "restrictionType": string;
  "restrictionReason": string;
  "expirationData": LolSummonerProfilesRestrictionExpiration;
  "restrictionsMillis": number;
}
export interface LolSummonerProfilesRestrictionExpiration {
  "expirationMillis": number;
  "redemptions": LolSummonerProfilesRestrictionRedemption[];
}
export interface LolSummonerProfilesRestrictionRedemption {
  "redemptionEventType": string;
  "redemptionCountRemaining": number;
  "redemptionCountRequired": number;
}
export interface LolSummonerProfilesRestrictionsView {
  "restrictions": LolSummonerProfilesRestriction[];
}
export interface LolSummonerProfilesRewardsEligibility {
  "honorRequirementEnabled": boolean;
  "minHonorLevelForRewards": number;
  "honorLevel"?: number;
}
export interface LolSummonerProfilesSummonerLevel {
  "puuid": string;
  "level": number;
  "xpSinceLastLevel": number;
  "xpToNextLevel": number;
}
export interface LolSummonerProfilesViews {
  "views": string[];
}
export interface LolSummonerRerollDataBagForClientV1 {
  "queueId": number;
  "pointsUntilNextReroll": number;
  "rerollCount": number;
  "totalPoints": number;
  "maximumRerolls": number;
  "pointCostOfReroll": number;
}
export interface LolSummonerStatus {
  "ready": boolean;
}
export interface LolSummonerSummoner {
  "summonerId": number;
  "accountId": number;
  "displayName": string;
  "internalName": string;
  "profileIconId": number;
  "summonerLevel": number;
  "xpSinceLastLevel": number;
  "xpUntilNextLevel": number;
  "percentCompleteForNextLevel": number;
  "rerollPoints": LolSummonerSummonerRerollPoints;
  "puuid": string;
  "nameChangeFlag": boolean;
  "unnamed": boolean;
  "privacy": LolSummonerProfilePrivacySetting;
  "gameName": string;
  "tagLine": string;
}
export interface LolSummonerSummonerCacheData {
  "summoner"?: LolSummonerSummoner;
  "summonerIcon"?: number;
  "privacy"?: LolSummonerProfilePrivacySetting;
}
export interface LolSummonerSummonerCreateRequest {
  "summonerName": string;
}
export interface LolSummonerSummonerCreatedId {
  "summonerId": number;
}
export interface LolSummonerSummonerDTO {
  "id": number;
  "accountId": number;
  "puuid": string;
  "name": string;
  "partnerId": string;
  "profileIconId": number;
  "level": number;
  "expPoints": number;
  "expToNextLevel": number;
  "nameChangeFlag": boolean;
  "unnamed": boolean;
  "privacy": LolSummonerProfilePrivacySetting;
}
export interface LolSummonerSummonerIcon {
  "profileIconId": number;
  "inventoryToken": string;
}
export interface LolSummonerSummonerIdAndIcon {
  "summonerId": number;
  "profileIconId": number;
  "puuid": string;
}
export interface LolSummonerSummonerIdAndName {
  "summonerId": number;
  "displayName": string;
  "puuid": string;
}
export interface LolSummonerSummonerLevelView {
  "puuid": string;
  "level": number;
  "xpSinceLastLevel": number;
  "xpToNextLevel": number;
}
export interface LolSummonerSummonerProfileUpdate {
  "key": string;
  "value": unknown;
  "inventory": string;
}
export interface LolSummonerSummonerRequestedName {
  "name": string;
}
export interface LolSummonerSummonerRerollPoints {
  "pointsToReroll": number;
  "currentPoints": number;
  "numberOfRolls": number;
  "maxRolls": number;
  "pointsCostToRoll": number;
}
export interface LolSummonerSummonerSession {
  "summonerId": number;
  "displayName": string;
  "isNewPlayer": boolean;
}
export interface LolSummonerUserInfo {
  "userInfo": string;
}
export interface LolSummonerXpAndLevelMessage {
  "xp": unknown;
  "level": LolSummonerLevelField;
}
export interface LolTastesDataModelResponse {
  "responseCode": number;
  "modelData": unknown;
}
export interface LolTftDataModelResponse {
  "responseCode": number;
  "modelData": unknown;
}
export interface LolTftEventCAPMission {
  "missionId": string;
  "title": string;
  "description": string;
  "missionIconAsset": LolTftEventMissionAsset;
  "rewards": LolTftEventCAPMissionReward[];
  "objectives": LolTftEventCAPMissionObjective[];
}
export interface LolTftEventCAPMissionCollection {
  "missionCollectionId": string;
  "dates": LolTftEventCAPMissionCollectionDates;
  "seriesList": LolTftEventCAPMissionSeries[];
}
export interface LolTftEventCAPMissionCollectionDateRange {
  "activationTimeEpoch": number;
  "deactivationTimeEpoch": number;
}
export interface LolTftEventCAPMissionCollectionDates {
  "live": LolTftEventCAPMissionCollectionDateRange;
  "pbe": LolTftEventCAPMissionCollectionDateRange;
  "internal": LolTftEventCAPMissionCollectionDateRange;
}
export interface LolTftEventCAPMissionObjective {
  "statId": string;
  "description": string;
}
export interface LolTftEventCAPMissionReward {
  "itemId": string;
  "rewardName": string;
  "quantity": number;
  "rewardAsset": LolTftEventMissionAsset;
}
export interface LolTftEventCAPMissionSeries {
  "seriesId": string;
  "seriesTitle": string;
  "seriesBackgroundImageUrl": string;
  "seriesIconAsset": LolTftEventMissionAsset;
  "missions": LolTftEventCAPMission[];
}
export interface LolTftEventCapMissionSeries {
  "name": string;
  "configurationId": string;
  "missions": LolTftEventCapMissionSeriesMission[];
}
export interface LolTftEventCapMissionSeriesMission {
  "name": string;
  "missionId": string;
  "expression": string;
  "missionCollectionId": string;
  "status": string;
  "completedTimeUtc": string;
  "missionInstanceId": string;
  "objectives": LolTftEventCapMissionSeriesMissionObjective[];
  "eligibility": LolTftEventCapMissionSeriesMissionEligibility[];
  "rewardsStatus": LolTftEventCapMissionSeriesMissionRewardsStatus;
  "repeatSequence": number;
  "properties": Record<string, string>;
  "metadata": Record<string, string>;
}
export interface LolTftEventCapMissionSeriesMissionEligibility {
  "type": string;
  "missionCollectionId": string;
  "missionId": string;
  "startTime": string;
}
export interface LolTftEventCapMissionSeriesMissionObjective {
  "statId": string;
  "objectiveId": string;
  "goal": number;
  "currentValue": number;
}
export interface LolTftEventCapMissionSeriesMissionReward {
  "type": string;
  "counterId": string;
  "itemId": string;
  "itemTypeId": string;
  "typeId": string;
  "currencyId": string;
  "amount": number;
  "quantity": number;
}
export interface LolTftEventCapMissionSeriesMissionRewardsStatus {
  "requiresClaim": boolean;
  "status": string;
  "rewards": LolTftEventCapMissionSeriesMissionReward[];
}
export interface LolTftEventCapMissionsMarkAsViewedPostBody {
  "events": LolTftEventCapMissionsMarkAsViewedPostBodyEvent[];
}
export interface LolTftEventCapMissionsMarkAsViewedPostBodyEvent {
  "configurationId": string;
  "missions": LolTftEventCapMissionsMarkAsViewedPostBodyMission[];
}
export interface LolTftEventCapMissionsMarkAsViewedPostBodyMission {
  "missionInstanceId": string;
  "metadata": Record<string, string>;
}
export interface LolTftEventCapMissionsMeResponse {
  "productId": string;
  "ownerId": string;
  "series": LolTftEventCapMissionSeries[];
}
export interface LolTftEventCollectionsChampion {
  "id": number;
  "freeToPlay": boolean;
  "ownership": LolTftEventCollectionsOwnership;
  "skins": LolTftEventCollectionsChampionSkin[];
}
export interface LolTftEventCollectionsChampionSkin {
  "championId": number;
  "id": number;
  "ownership": LolTftEventCollectionsOwnership;
}
export interface LolTftEventCollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": LolTftEventCollectionsRental;
}
export interface LolTftEventCollectionsRental {
  "rented": boolean;
}
export interface LolTftEventCollectionsSummoner {
  "summonerLevel": number;
}
export interface LolTftEventCollectionsSummonerIcons {
  "icons": number[];
}
export interface LolTftEventCollectionsWardSkin {
  "id": number;
  "ownership": LolTftEventCollectionsOwnership;
}
export interface LolTftEventDataModelResponse {
  "responseCode": number;
  "modelData": unknown;
}
export interface LolTftEventGameflowGameData {
  "gameId": number;
  "queue": LolTftEventQueue;
}
export type LolTftEventGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolTftEventGameflowSession {
  "phase": LolTftEventGameflowPhase;
}
export type LolTftEventGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolTftEventInventoryItemWithPayload {
  "itemId": number;
}
export interface LolTftEventKiwiHubConfiguration {
  "missionsSeries": LolTftEventCAPMissionSeries;
}
export interface LolTftEventLoginSession {
  "accountId": number;
  "summonerId": number;
  "puuid": string;
  "platformId": string;
}
export type LolTftEventLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolTftEventLolTftBackgrounds {
  "backgrounds": Record<string, string>;
}
export interface LolTftEventLolTftBattlePassHub {
  "battlePassXPBoosted": boolean;
}
export interface LolTftEventLolTftEvent {
  "titleTranslationKey": string;
  "eventId": string;
  "enabled": boolean;
  "url": string;
  "urlFaq": string;
  "startDate": string;
  "endDate": string;
  "seriesId": string;
  "dailyLoginSeriesId": string;
  "queueIds": number[];
  "defaultLandingPage": boolean;
  "eventHubAssetKey": string;
  "eventHubTemplateType": string;
  "eventPassId": string;
  "skillTreePassId": string;
  "eventFuture": boolean;
  "weblinkSubnavs": LolTftEventLolTftEventWebLinkSubnav[];
}
export interface LolTftEventLolTftEventWebLinkSubnav {
  "enabled": boolean;
  "key": string;
  "titleTranslationKey": string;
  "url": string;
}
export interface LolTftEventLolTftEvents {
  "subNavTabs": LolTftEventLolTftEvent[];
}
export interface LolTftEventLolTftHomeHub {
  "enabled": boolean;
  "tacticianPromoOfferIds": string[];
  "primeGamingPromoOffer"?: LolTftEventLolTftPrimeGaming;
  "overrideUrl": string;
  "headerButtonsOverrideUrl": string;
  "rotatingShopPromos": LolTftEventTFTRotatingShopPromos;
}
export interface LolTftEventLolTftNewsHub {
  "enabled": boolean;
  "url": string;
}
export interface LolTftEventLolTftPrimeGaming {
  "url": string;
  "assetId": string;
}
export interface LolTftEventLolTftPromoButton {
  "enabled": boolean;
  "showTimerWhileEventActive": boolean;
  "eventAssetId": string;
  "eventKey": string;
  "url": string;
}
export interface LolTftEventLolTftPromoButtons {
  "promoButtons": LolTftEventLolTftPromoButton[];
}
export interface LolTftEventLolTftTencentEventHubConfig {
  "troveAssetId": string;
  "troveURL": string;
  "logoAssetId": string;
}
export interface LolTftEventLolTftTencentEventHubConfigs {
  "tencentEventhubConfigs": LolTftEventLolTftTencentEventHubConfig[];
}
export type LolTftEventLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolTftEventLoyaltyStatusNotification {
  "status": LolTftEventLoyaltyStatus;
}
export interface LolTftEventMissionAsset {
  "internalName": string;
  "path": string;
  "iconNeedsFrame": boolean;
}
export interface LolTftEventMissionsNotificationResource {
  "backgroundUrl": string;
  "created": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
}
export interface LolTftEventMissionsSettingsDataResource {
  "selected_series": string;
}
export interface LolTftEventPlayerUpdateResponse {
  "playerMissions": PlayerMissionDTO[];
  "playerSeries": SeriesDTO[];
}
export interface LolTftEventPluginRegionLocaleChangedEvent {
  "locale": string;
}
export interface LolTftEventPublishingSettings {
  "publishingLocale": string;
}
export interface LolTftEventPveAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolTftEventPveCAPMission {
  "missionId": string;
  "title": string;
  "description": string;
  "missionIconAsset": LolTftEventPveMissionAsset;
  "rewards": LolTftEventPveCAPMissionReward[];
  "objectives": LolTftEventPveCAPMissionObjective[];
}
export interface LolTftEventPveCAPMissionObjective {
  "statId": string;
  "description": string;
}
export interface LolTftEventPveCAPMissionReward {
  "itemId": string;
  "rewardName": string;
  "quantity": number;
  "rewardAsset": LolTftEventPveMissionAsset;
}
export interface LolTftEventPveCatalogItem {
  "itemId": number;
  "inventoryType": string;
  "itemInstanceId"?: string;
}
export interface LolTftEventPveClientCacheClearMessageDTO {
  "regions": string[];
  "clearAll": boolean;
  "inventoryTypes": string[];
}
export interface LolTftEventPveCreateLoadoutDTO {
  "scope": string;
  "itemId"?: number;
  "name": string;
  "loadout": Record<string, LolTftEventPveItemKey>;
  "refreshTime": string;
}
export interface LolTftEventPveCreateLoadoutRequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": LolTftEventPveCreateLoadoutDTO;
}
export interface LolTftEventPveCreateOrUpdateItemsRequest {
  "id": number;
  "items": Record<string, unknown>;
  "inventoryJWTs": string[];
}
export interface LolTftEventPveCurrencyDTO {
  "amount": number;
  "subCurrencies": Record<string, number>;
}
export interface LolTftEventPveEndOfGameXp {
  "PER_WIN": number;
}
export interface LolTftEventPveEndOfGameXpNotification {
  "xp": LolTftEventPveEndOfGameXp;
}
export type LolTftEventPveEventPVELevelState = "kCleared" | "kError" | "kLocked" | "kUnlocked" | "kUnseenUnlocked";
export interface LolTftEventPveFrontendInventoryResponse {
  "entitlements": LolTftEventPveItemKey[];
}
export interface LolTftEventPveGameflowGameData {
  "queue": LolTftEventPveQueue;
}
export type LolTftEventPveGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolTftEventPveGameflowSession {
  "phase": LolTftEventPveGameflowPhase;
  "gameData": LolTftEventPveGameflowGameData;
}
export interface LolTftEventPveGetItemsRequest {
  "id": number;
  "inventoryTypes": string[];
  "inventoryJWTs": string[];
}
export interface LolTftEventPveIds {
  "missionIds": string[];
  "seriesIds": string[];
}
export interface LolTftEventPveInventoryCacheEntry {
  "signedInventoryJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolTftEventPveInventoryDTO {
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "items": Record<string, unknown>;
  "expires": string;
  "itemsJwt"?: string;
}
export interface LolTftEventPveInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolTftEventPveItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "wins": number;
}
export interface LolTftEventPveInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "f2p": boolean;
  "rental": boolean;
  "lsb": boolean;
  "wins": number;
}
export interface LolTftEventPveInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolTftEventPveItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "owned": boolean;
  "wins": number;
  "payload": unknown;
}
export interface LolTftEventPveInventoryNotification {
  "id": number;
  "itemId": number;
  "inventoryType": string;
  "type": string;
  "acknowledged": boolean;
}
export interface LolTftEventPveInventoryResponseDTO {
  "data": LolTftEventPveInventoryDTO;
}
export interface LolTftEventPveItemKey {
  "inventoryType": string;
  "contentId": string;
  "itemId": number;
  "data": Record<string, string>;
}
export type LolTftEventPveItemOwnershipType = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolTftEventPveLoadout {
  "id": number;
  "name": string;
  "items": Record<string, unknown>;
}
export interface LolTftEventPveLoadoutRequestDTOBase {
  "serviceToJwtsMap": Record<string, unknown>;
}
export interface LolTftEventPveLoginSession {
  "state": LolTftEventPveLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
  "puuid": string;
}
export type LolTftEventPveLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolTftEventPveLolInventoryType {
  "inventoryTypeId": string;
  "capInventoryTypeId": string;
}
export interface LolTftEventPveLoyaltyRewards {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": Record<string, number>;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export interface LolTftEventPveLoyaltyRewardsSimplified {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": number;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export type LolTftEventPveLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolTftEventPveLoyaltyStatusNotification {
  "status": LolTftEventPveLoyaltyStatus;
  "rewards": LolTftEventPveLoyaltyRewardsSimplified;
  "reloadInventory": boolean;
}
export interface LolTftEventPveMission {
  "viewed": boolean;
  "id": string;
  "title": string;
  "helperText": string;
  "description": string;
  "missionLineText": string;
  "iconImageUrl": string;
  "seriesName": string;
  "rewards": LolTftEventPveReward[];
  "status": string;
  "missionType": string;
  "displayType": string;
  "completedDate": number;
  "celebrationType": string;
}
export interface LolTftEventPveMissionAsset {
  "internalName": string;
  "path": string;
  "iconNeedsFrame": boolean;
}
export interface LolTftEventPvePlayerNotification {
  "critical": boolean;
  "detailKey": string;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
  "iconUrl": string;
}
export interface LolTftEventPveQueue {
  "isTeamBuilderManaged": boolean;
}
export interface LolTftEventPveReward {
  "rewardType": string;
  "rewardGroup": string;
  "description": string;
  "iconUrl": string;
  "smallIconUrl": string;
  "itemId": string;
  "itemTypeId": string;
  "uniqueName": string;
  "rewardFulfilled": boolean;
  "rewardGroupSelected": boolean;
  "sequence": number;
  "quantity": number;
  "isObjectiveBasedReward": boolean;
  "media": Record<string, string>;
  "iconNeedsFrame": boolean;
}
export interface LolTftEventPveRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolTftEventPveRmsEntitlementPayload {
  "itemId": string;
  "itemTypeId": string;
  "tiers": string;
  "entitlementTypeId": string;
  "resourceOperation": string;
}
export interface LolTftEventPveRmsStoreEntitlementItem {
  "inventoryType": string;
  "itemId": string;
}
export interface LolTftEventPveRmsStoreEntitlementPayload {
  "transactionId": string;
  "items": LolTftEventPveRmsStoreEntitlementItem[];
}
export interface LolTftEventPveRmsWalletPayload {
}
export interface LolTftEventPveRmsXboxSubscriptionChange {
  "puuid": string;
  "subscriptionId": string;
  "active": string;
  "identityProvider": string[];
}
export interface LolTftEventPveScopedLoadout {
  "scope": string;
  "itemId"?: number;
  "name": string;
  "loadout": Record<string, LolTftEventPveItemKey>;
  "refreshTime": string;
  "id": string;
}
export interface LolTftEventPveSignGCORequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": Record<string, LolTftEventPveItemKey>;
}
export interface LolTftEventPveSimpleInventoryDTO {
  "items": Record<string, unknown>;
  "itemsJwt": string;
  "expires": string;
}
export interface LolTftEventPveSimpleInventoryResponseDTO {
  "data": LolTftEventPveSimpleInventoryDTO;
}
export interface LolTftEventPveSummonerIcon {
  "itemId": number;
}
export interface LolTftEventPveTFTEventBuddiesData {
  "Buddies": LolTftEventPveTFTEventBuddyData[];
}
export interface LolTftEventPveTFTEventBuddy {
  "isPremium": boolean;
  "completedSummit": boolean;
  "completedPerfectRun": boolean;
  "journeyTrackUnlockLevel": number;
  "id": number;
  "contentId": string;
  "name": string;
  "description": string;
  "selectionVOKey": string;
  "shortDescription": string;
  "iconTexture": string;
  "portraitTexture": string;
  "hubTexture": string;
  "summitMissionId": string;
  "perfectRunMissionId": string;
  "equipState": LolTftEventPveTFTEventBuddyEquipState;
}
export interface LolTftEventPveTFTEventBuddyData {
  "IsPremium": boolean;
  "JourneyTrackUnlockLevel": number;
  "ContentId": string;
  "ItemId": number;
  "Name": string;
  "Description": string;
  "SelectionVOKey": string;
  "ShortDescription": string;
  "IconTexturePath": string;
  "PortraitTexturePath": string;
  "HubTexturePath": string;
  "SummitMission": LolTftEventPveCAPMission;
  "PerfectMission": LolTftEventPveCAPMission;
}
export type LolTftEventPveTFTEventBuddyEquipState = "kEquipped" | "kLocked" | "kUnlocked" | "kUnseenUnlocked";
export interface LolTftEventPveTFTEventDifficultyData {
  "ItemId": number;
  "DifficultyLevel": number;
  "Name": string;
  "Description": string;
  "IconTexture": string;
  "ContentId": string;
}
export interface LolTftEventPveTFTEventJourneyTrackCollectionData {
  "Bonuses": LolTftEventPveTFTEventJourneyTrackXPData[];
}
export interface LolTftEventPveTFTEventJourneyTrackXPData {
  "Name": string;
}
export interface LolTftEventPveTFTEventPVEEoGMissionReward {
  "name": string;
  "iconTexture": string;
  "type": string;
  "itemTypeId": string;
  "quantity": number;
  "firstCompletionLevelMission": boolean;
}
export interface LolTftEventPveTFTEventPVEHub {
  "levels": LolTftEventPveTFTEventPVELevel[];
  "ultimateVictory": LolTftEventPveTFTEventPVEUltimateVictory;
}
export interface LolTftEventPveTFTEventPVEHubData {
  "Levels": LolTftEventPveTFTEventPVELevelData[];
}
export interface LolTftEventPveTFTEventPVEJourneyTrackBonuses {
  "names": string[];
}
export interface LolTftEventPveTFTEventPVELevel {
  "status": LolTftEventPveEventPVELevelState;
  "isSelected": boolean;
  "difficultyLevel": number;
  "id": number;
  "contentId": string;
  "name": string;
  "recommended": string;
  "description": string;
  "descriptionUnlocked": string;
  "descriptionCleared": string;
  "missionId": string;
  "lockedPortrait": string;
  "unlockedPortrait": string;
  "clearedPortrait": string;
  "levelSymbol": string;
  "rewards": LolTftEventPveTFTEventPVEReward[];
}
export interface LolTftEventPveTFTEventPVELevelData {
  "Name": string;
  "Recommended": string;
  "Description": string;
  "DescriptionUnlocked": string;
  "DescriptionCleared": string;
  "LockedImagePath": string;
  "UnlockedImagePath": string;
  "ClearedImagePath": string;
  "SymbolImagePath": string;
  "Mission": LolTftEventPveCAPMission;
  "Difficulty": LolTftEventPveTFTEventDifficultyData;
}
export interface LolTftEventPveTFTEventPVELevelDetails {
  "mBossCost": number;
  "mNumAffixes": number;
  "mNumEnemyModifiers": number;
}
export interface LolTftEventPveTFTEventPVEReward {
  "rewardName": string;
  "rewardImage": string;
  "rewardQuantity": number;
}
export interface LolTftEventPveTFTEventPVEUltimateVictory {
  "name": string;
  "description": string;
  "reward": LolTftEventPveTFTEventPVEReward;
  "achievedUltimateVictory": boolean;
  "seenCelebration": boolean;
}
export interface LolTftEventPveTftBattlepass {
  "totalPointsEarned": number;
  "milestones": LolTftEventPveTftBattlepassMilestone[];
  "bonuses": LolTftEventPveTftBattlepassMilestone[];
  "activeMilestone": LolTftEventPveTftBattlepassMilestone;
  "info": LolTftEventPveTftBattlepassInfo;
  "lastViewedProgress": number;
  "lastViewedMilestone": LolTftEventPveTftBattlepassMilestone;
  "currentLevel": number;
}
export interface LolTftEventPveTftBattlepassInfo {
  "title": string;
  "description": string;
  "startDate": number;
  "endDate": number;
  "premium": boolean;
  "premiumTitle": string;
  "premiumEntitlementId": string;
  "pcPurchaseRequirement": string;
  "passId": string;
  "hasLevelPurchasing": boolean;
  "media": Record<string, string>;
  "passType": LolTftEventPveTftPassType;
}
export interface LolTftEventPveTftBattlepassMilestone {
  "milestoneId": string;
  "title": string;
  "description": string;
  "status": string;
  "pointsNeededForMilestone": number;
  "pointsEarnedForMilestone": number;
  "totalPointsForMilestone": number;
  "level": number;
  "iconImageUrl": string;
  "iconNeedsFrame": boolean;
  "rewards": LolTftEventPveTftBattlepassReward[];
  "isPaid": boolean;
  "isLocked": boolean;
  "isKeystone": boolean;
  "isBonus": boolean;
  "isClaimRequestPending": boolean;
}
export interface LolTftEventPveTftBattlepassReward {
  "name": string;
  "description": string;
  "itemId": string;
  "itemTypeId": string;
  "iconUrl": string;
  "iconNeedsFrame": boolean;
}
export type LolTftEventPveTftPassType = "kBattlePass" | "kDailyLoginPass" | "kEventPass" | "kSkillTreePass" | "kUnknown";
export interface LolTftEventPveUpdateLoadoutDTO {
  "id": string;
  "name": string;
  "loadout": Record<string, LolTftEventPveItemKey>;
}
export interface LolTftEventPveUpdateLoadoutRequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": LolTftEventPveUpdateLoadoutDTO;
}
export interface LolTftEventPveWallet {
  "ip": number;
  "rp": number;
}
export interface LolTftEventPveWalletCacheEntry {
  "signedBalancesJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolTftEventPveWalletDTO {
  "puuid": string;
  "accountId": number;
  "expires": string;
  "balances": Record<string, number>;
  "balancesJwt": string;
}
export interface LolTftEventPveWalletResponseDTO {
  "data": LolTftEventPveWalletDTO;
}
export interface LolTftEventPveWalletUpdateNotification {
  "receivedAtMs": number;
  "amount": number;
  "currencyType": string;
}
export interface LolTftEventPveXboxSubscriptionStatus {
  "active": string;
  "subscriptionId": string;
}
export interface LolTftEventQueue {
  "id": number;
  "mapId": number;
  "gameMode": string;
  "category": LolTftEventQueueGameCategory;
}
export type LolTftEventQueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface LolTftEventRewardGrant {
  "info": LolTftEventRewardGrantInfo;
  "rewardGroup": LolTftEventRewardGroup;
}
export interface LolTftEventRewardGrantElement {
  "id": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "rewardStatus": LolTftEventRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolTftEventRewardGrantInfo {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "status": LolTftEventGrantStatus;
  "grantElements": LolTftEventRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
}
export interface LolTftEventRewardGroup {
  "id": string;
  "internalName": string;
  "productId": string;
  "types": string[];
  "rewards": LolTftEventSvcReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolTftEventRewardStrategy;
  "selectionStrategyConfig": LolTftEventSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolTftEventRewardGroupsSelection {
  "rewardGroups": string[];
}
export type LolTftEventRewardStatus = "FULFILLED" | "PENDING";
export type LolTftEventRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolTftEventRewardsProductConfig {
  "enabled": boolean;
  "serviceUrl": string;
}
export interface LolTftEventRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolTftEventRiotMessagingServicePayload {
  "deltaEventId": string;
  "ownerId": string;
  "updatedMissions": string[];
}
export interface LolTftEventSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolTftEventSeriesOpt {
  "seriesId": string;
  "option": string;
}
export interface LolTftEventSettingsResource {
  "data": unknown;
}
export interface LolTftEventSvcReward {
  "id": string;
  "itemId": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolTftEventTFTEventMissionChain {
  "chainIndex": number;
  "chainSize": number;
  "missions": PlayerMissionDTO[];
}
export interface LolTftEventTFTEventMissionChains {
  "missionChains": LolTftEventTFTEventMissionChain[];
  "seriesId": string;
}
export interface LolTftEventTFTRotatingShopPromo {
  "id": string;
  "bundleId": string;
  "storeType": string;
  "isDeepLink": boolean;
}
export interface LolTftEventTFTRotatingShopPromos {
  "firstPromos": LolTftEventTFTRotatingShopPromo[];
  "secondPromos": LolTftEventTFTRotatingShopPromo[];
  "fallbackPromo": LolTftEventTFTRotatingShopPromo;
}
export interface LolTftEventTftOrb {
  "missionId": string;
  "status": string;
  "unlockTime": number;
  "rewardLevel": number;
  "rewards": PlayerMissionRewardDTO[];
}
export interface LolTftEventTftWeeklyMissions {
  "missions": PlayerMissionDTO[];
}
export interface LolTftEventUserInfo {
  "userInfo": string;
}
export interface LolTftGameflowGameData {
  "gameId": number;
  "queue": LolTftQueue;
}
export type LolTftGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolTftGameflowSession {
  "phase": LolTftGameflowPhase;
  "gameData": LolTftGameflowGameData;
}
export interface LolTftLolTftBackgrounds {
  "backgrounds": Record<string, string>;
}
export interface LolTftLolTftBattlePassHub {
  "battlePassXPBoosted": boolean;
}
export interface LolTftLolTftEvent {
  "titleTranslationKey": string;
  "eventId": string;
  "enabled": boolean;
  "url": string;
  "urlFaq": string;
  "startDate": string;
  "endDate": string;
  "seriesId": string;
  "dailyLoginSeriesId": string;
  "queueIds": number[];
  "defaultLandingPage": boolean;
  "eventHubAssetKey": string;
  "eventHubTemplateType": string;
  "eventPassId": string;
  "skillTreePassId": string;
  "eventFuture": boolean;
  "weblinkSubnavs": LolTftLolTftEventWebLinkSubnav[];
}
export interface LolTftLolTftEventWebLinkSubnav {
  "enabled": boolean;
  "key": string;
  "titleTranslationKey": string;
  "url": string;
}
export interface LolTftLolTftEvents {
  "subNavTabs": LolTftLolTftEvent[];
}
export interface LolTftLolTftHomeHub {
  "enabled": boolean;
  "tacticianPromoOfferIds": string[];
  "primeGamingPromoOffer"?: LolTftLolTftPrimeGaming;
  "overrideUrl": string;
  "headerButtonsOverrideUrl": string;
  "rotatingShopPromos": LolTftTFTRotatingShopPromos;
}
export interface LolTftLolTftNewsHub {
  "enabled": boolean;
  "url": string;
}
export interface LolTftLolTftPrimeGaming {
  "url": string;
  "assetId": string;
}
export interface LolTftLolTftPromoButton {
  "enabled": boolean;
  "showTimerWhileEventActive": boolean;
  "eventAssetId": string;
  "eventKey": string;
  "url": string;
}
export interface LolTftLolTftPromoButtons {
  "promoButtons": LolTftLolTftPromoButton[];
}
export interface LolTftLolTftTencentEventHubConfig {
  "troveAssetId": string;
  "troveURL": string;
  "logoAssetId": string;
}
export interface LolTftLolTftTencentEventHubConfigs {
  "tencentEventhubConfigs": LolTftLolTftTencentEventHubConfig[];
}
export interface LolTftPassAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolTftPassActiveEventUIData {
  "eventId": string;
  "eventInfo": LolTftPassEventInfoUIData;
}
export interface LolTftPassActivityCenterMilestones {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "isGameModeEvent": boolean;
  "queueId": number;
  "localizedLogo": string;
  "localizedEventSubtitle": string;
  "localizedHelpUrl": string;
  "backgroundImage": string;
  "helpModalImage": string;
  "objectiveBannerImage": string;
  "objectiveCard": LolTftPassObjectiveCard;
  "eventPassBundlesCatalogEntry": LolTftPassCatalogEntry[];
  "rewardTrack": LolTftPassRewardTrack;
}
export interface LolTftPassBundleOfferUIData {
  "details": LolTftPassBundledItemUIData;
  "initialPrice": number;
  "finalPrice": number;
  "futureBalance": number;
  "isPurchasable": boolean;
  "discountPercentage": number;
  "bundledItems": LolTftPassBundledItemUIData[];
}
export interface LolTftPassBundledItemUIData {
  "name": string;
  "itemId": number;
  "description": string;
  "inventoryType": string;
  "subInventoryType": string;
  "splashImage": string;
  "owned": boolean;
  "quantity": number;
  "decoratorBadgeURL": string;
}
export interface LolTftPassCatalogEntry {
  "contentId": string;
  "itemId": number;
  "offerId": string;
  "typeId": string;
}
export interface LolTftPassCatalogItem {
  "itemId": number;
  "inventoryType": string;
  "itemInstanceId"?: string;
}
export type LolTftPassCelebrationType = "FULLSCREEN" | "NONE" | "TOAST";
export interface LolTftPassChapter {
  "localizedTitle": string;
  "localizedDescription": string;
  "cardImage": string;
  "backgroundImage": string;
  "objectiveBannerImage": string;
  "chapterStart": number;
  "chapterEnd": number;
  "chapterNumber": number;
  "levelFocus": number;
}
export interface LolTftPassChaptersUIData {
  "currentChapter": number;
  "chapters": LolTftPassChapter[];
}
export interface LolTftPassClientCacheClearMessageDTO {
  "regions": string[];
  "clearAll": boolean;
  "inventoryTypes": string[];
}
export interface LolTftPassContentDrop {
  "patch": string;
  "activationDate": string;
  "offers": LolTftPassOffer[];
}
export interface LolTftPassCounter {
  "id": string;
  "name": string;
  "groupId": string;
  "direction": string;
  "startValue": number;
}
export interface LolTftPassCounterInstance {
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "counterValue": number;
}
export interface LolTftPassCurrencyDTO {
  "amount": number;
  "subCurrencies": Record<string, number>;
}
export interface LolTftPassDemaciaPass {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "helpModalImage": string;
  "objectiveBannerImage": string;
  "eventPassBundlesCatalogEntry": LolTftPassCatalogEntry[];
  "rewardTrack": LolTftPassRewardTrack;
  "tokenBankTrack": LolTftPassRewardTrack;
  "tokenCurrency": LolTftPassLolCurrency;
}
export interface LolTftPassEndOfGameXp {
  "PER_WIN": number;
}
export interface LolTftPassEndOfGameXpNotification {
  "xp": LolTftPassEndOfGameXp;
}
export interface LolTftPassEntityInstance {
  "schemaVersion": string;
  "groupId": string;
  "counters": LolTftPassCounterInstance[];
  "milestones": LolTftPassMilestoneInstance[];
}
export interface LolTftPassEventBackgroundUIData {
  "backgroundImagePath": string;
}
export interface LolTftPassEventDetailsUIData {
  "eventIconPath": string;
  "eventName": string;
  "headerTitleImagePath": string;
  "progressEndDate": string;
  "shopEndDate": string;
  "eventStartDate": string;
  "helpModalImagePath": string;
  "inducteeName": string;
  "promotionBannerImage": string;
  "objectiveBannerImage": string;
  "memoryBookBackgroundImage": string;
  "spotlightSkinId": number;
  "actBackgroundImage": string;
}
export type LolTftPassEventHubType = "ActivityCenterMilestones" | "DemaciaPass" | "EventShop" | "HallOfLegends" | "SeasonPass";
export interface LolTftPassEventInfoUIData {
  "eventId": string;
  "eventName": string;
  "eventType": string;
  "eventIcon": string;
  "navBarIcon": string;
  "battleExpIcon": string;
  "localizedShortName": string;
  "eventTokenImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "seasonPassSubType": LolTftPassSeasonPassSubType;
  "localizedLogo": string;
  "localizedEventSubtitle": string;
  "localizedHelpUrl": string;
  "objectiveCard": LolTftPassObjectiveCard;
  "currentTokenBalance": number;
  "lockedTokenCount": number;
  "unclaimedRewardCount": number;
  "timeOfLastUnclaimedReward": number;
  "isPassPurchased": boolean;
  "isGameModeEvent": boolean;
  "queueId": number;
  "eventPassBundles": LolTftPassCatalogEntry[];
  "tokenBundles": LolTftPassCatalogEntry[];
}
export interface LolTftPassEventPassInfo {
  "eventId": string;
  "isPassPurchased": boolean;
}
export interface LolTftPassEventShop {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "backgroundImage": string;
  "navbarIconImage": string;
  "headerIconImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "localizedUpsellTitle": string;
  "localizedUpsellTooltipTitle": string;
  "localizedUpsellTooltipDescription": string;
  "localizedUpsellButtonText": string;
  "upsellBackgroundImageUrl": string;
  "upsellTooltipBackgroundImageUrl": string;
  "helpModalImage": string;
  "eventPassBundlesCatalogEntry": LolTftPassCatalogEntry[];
  "tokenShop": LolTftPassTokenShop;
  "rewardTrack": LolTftPassRewardTrack;
}
export interface LolTftPassFSC {
  "id": string;
  "canvas": LolTftPassFSCCanvas;
  "media": LolTftPassFSCMedia;
  "rewards": LolTftPassFSCRewards[];
}
export interface LolTftPassFSCCanvas {
  "title": string;
  "subtitle": string;
  "description": string;
  "canvasBackgroundImage": string;
  "canvasSize": LolTftPassFSCCanvasSize;
  "canvasDesign": string;
  "buttonText": string;
}
export type LolTftPassFSCCanvasSize = "FULL" | "LARGE" | "MEDIUM" | "SMALL";
export interface LolTftPassFSCMedia {
  "introAnimation": string;
  "introAnimationAudio": string;
  "introLowSpecImage": string;
  "loopAnimation": string;
  "loopAnimationAudio": string;
  "transitionAnimation": string;
  "transitionAnimationAudio": string;
}
export interface LolTftPassFSCRewards {
  "itemId": number;
  "image": string;
  "imageOverlay": string;
  "title": string;
  "subtitle": string;
}
export type LolTftPassGrantStatus = "FAILED" | "FULFILLED" | "PENDING_FULFILLMENT" | "PENDING_SELECTION";
export interface LolTftPassGrantorDescription {
  "appName": string;
  "entityId": string;
}
export interface LolTftPassGroup {
  "id": string;
  "schemaVersion": string;
  "productId": string;
  "name": string;
  "repeat": LolTftPassRepeat;
  "counters": LolTftPassCounter[];
  "milestones": LolTftPassMilestone[];
}
export interface LolTftPassHallOfLegends {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "headerIconImage": string;
  "battleExpIconImage": string;
  "headerTitleImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "helpModalImage": string;
  "inducteeName": string;
  "spotlightSkin": LolTftPassSpotlightSkin;
  "promotionBannerImage": string;
  "objectiveBannerImage": string;
  "eventPassBundlesCatalogEntry": LolTftPassCatalogEntry[];
  "progressionPurchaseCatalogEntry": LolTftPassCatalogEntry;
  "skinIds": string[];
  "rewardTrack": LolTftPassRewardTrack;
  "narrativeElements": LolTftPassNarrativeElement[];
  "localizedUpsellTitle": string;
  "localizedUpsellTooltipTitle": string;
  "localizedUpsellTooltipDescription": string;
  "localizedUpsellButtonText": string;
  "upsellBackgroundImageUrl": string;
  "upsellTooltipBackgroundImageUrl": string;
  "upsellIconUrl": string;
  "memoryBookBackgroundImage": string;
}
export interface LolTftPassInventoryCacheEntry {
  "signedInventoryJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolTftPassInventoryDTO {
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "items": Record<string, unknown>;
  "expires": string;
  "itemsJwt": string;
}
export interface LolTftPassInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolTftPassItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "wins": number;
}
export interface LolTftPassInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "ownedQuantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "payload": unknown;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "lsb": boolean;
  "wins": number;
}
export interface LolTftPassInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolTftPassItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "owned": boolean;
  "wins": number;
  "payload": unknown;
}
export interface LolTftPassInventoryNotification {
  "id": number;
  "itemId": number;
  "inventoryType": string;
  "type": string;
  "acknowledged": boolean;
}
export interface LolTftPassInventoryResponseDTO {
  "data": LolTftPassInventoryDTO;
}
export interface LolTftPassItem {
  "itemId": string;
  "inventoryType": string;
  "price": number;
  "quantity": number;
}
export interface LolTftPassItemKey {
  "inventoryType": string;
  "itemId": number;
}
export interface LolTftPassItemOrderDTO {
  "inventoryType": string;
  "itemId": number;
  "quantity": number;
  "rpCost": number;
}
export type LolTftPassItemOwnershipType = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolTftPassLoginSession {
  "state": LolTftPassLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
  "puuid": string;
}
export type LolTftPassLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolTftPassLolCurrency {
  "capCurrencyId": string;
  "lolCurrencyId": string;
}
export interface LolTftPassLolInventoryType {
  "inventoryTypeId": string;
  "capInventoryTypeId": string;
}
export interface LolTftPassLoyaltyRewards {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": Record<string, number>;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export interface LolTftPassLoyaltyRewardsSimplified {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": number;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export type LolTftPassLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolTftPassLoyaltyStatusNotification {
  "status": LolTftPassLoyaltyStatus;
  "rewards": LolTftPassLoyaltyRewardsSimplified;
  "reloadInventory": boolean;
}
export interface LolTftPassMilestone {
  "id": string;
  "name": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "properties": Record<string, string>;
  "triggers": LolTftPassTrigger[];
  "triggerRequirement": string;
}
export interface LolTftPassMilestoneInstance {
  "milestoneId": string;
  "instanceId": string;
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "repeatSequence": number;
  "triggered": boolean;
  "triggeredTimestamp": string;
  "triggers": LolTftPassTrigger[];
}
export interface LolTftPassNarrativeElement {
  "localizedNarrativeTitle": string;
  "localizedNarrativeDescription": string;
  "narrativeBackgroundImage": string;
  "narrativeStartingTrackLevel": number;
  "narrativeVideo": LolTftPassNarrativeVideo;
}
export interface LolTftPassNarrativeVideo {
  "localizedNarrativeVideoUrl": string;
  "localizedPlayNarrativeButtonLabel": string;
  "localizedVideoTitle": string;
  "thumbnailImage": string;
  "narrativeVideoIsLockedOnLevel"?: boolean;
  "localizedNarrativeVideoDescription": string;
}
export interface LolTftPassNextRewardUIData {
  "thumbIconPath": string;
  "state": LolTftPassRewardTrackItemHeaderType;
  "name": string;
  "description": string;
  "level": string;
}
export interface LolTftPassObjectiveCard {
  "missionSeriesName": string;
  "objectiveGroup": string;
  "objectiveCategoryId": string;
}
export interface LolTftPassObjectivesBanner {
  "eventName": string;
  "promotionBannerImage": string;
  "objectiveBannerImage": string;
  "eventEndDate": string;
  "eventProgressEndDate": string;
  "isPassPurchased": boolean;
  "tokenBalance": number;
  "token": LolTftPassLolCurrency;
  "currentChapter": LolTftPassChapter;
  "trackProgressNextReward": LolTftPassTrackProgressNextReward;
  "trackProgress": LolTftPassTrackProgressNextReward;
  "rewardTrackProgress": LolTftPassRewardTrackProgress;
}
export interface LolTftPassOffer {
  "id": string;
  "localizedTitle": string;
  "localizedDescription": string;
  "image": string;
  "promotionType": LolTftPassOfferPromotionType;
  "offerCategory": LolTftPassOfferCategory;
  "items": LolTftPassItem[];
}
export type LolTftPassOfferCategory = "Borders" | "Chromas" | "Currencies" | "Featured" | "Loot" | "Skins" | "Tft";
export type LolTftPassOfferPromotionType = "kFeatured" | "kFeaturedHighlighted" | "kNone";
export interface LolTftPassPlayerNotification {
  "critical": boolean;
  "detailKey": string;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
  "iconUrl": string;
}
export interface LolTftPassPremiumEntitlement {
  "contentId": string;
}
export interface LolTftPassProgressInfoUIData {
  "tokenImage": string;
  "passPurchased": boolean;
  "eventPassBundlesCatalogEntry": LolTftPassCatalogEntry[];
}
export interface LolTftPassProgressionPurchaseUIData {
  "offerId": string;
  "pricePerLevel": number;
  "rpBalance": number;
  "itemId": number;
  "inventoryType": string;
}
export interface LolTftPassPurchaseOfferRequest {
  "offerId": string;
  "purchaseQuantity": number;
  "itemId": number;
  "inventoryType": string;
  "rpPrice": number;
}
export interface LolTftPassPurchaseOrderResponseDTO {
  "rpBalance": number;
  "ipBalance": number;
  "transactions": LolTftPassTransactionResponseDTO[];
}
export interface LolTftPassRMSPayload {
  "productId": string;
  "affinities": string[];
}
export interface LolTftPassRMSRequest {
  "resource": string;
  "service": string;
  "version": string;
  "recipients": string[];
  "payload": string;
}
export interface LolTftPassRMSRewardsNotificationPayload {
  "purchaserId": string;
  "recipientId": string;
  "transactionId": string;
  "rewardId": string;
  "rewardInstanceId": string;
  "status": string;
}
export interface LolTftPassRegionLocale {
  "region": string;
  "locale": string;
}
export interface LolTftPassRepeat {
  "count": number;
  "scope": number;
  "multiplier": number;
  "milestones": LolTftPassMilestone[];
  "repeatTriggers": LolTftPassRepeatGroupTrigger[];
}
export interface LolTftPassRepeatGroupTrigger {
  "type": string;
  "counterId": string;
  "startTriggerValue": number;
  "increaseBy": number;
  "multiplier": number;
}
export interface LolTftPassRequestDTO_SelectionRequestDTO {
  "data": LolTftPassSelectionRequestDTO;
  "metadata": LolTftPassRequestMetadataDTO;
}
export interface LolTftPassRequestDTO_vector_SelectionRequestDTO {
  "data": LolTftPassSelectionRequestDTO[];
  "metadata": LolTftPassRequestMetadataDTO;
}
export interface LolTftPassRequestDTO_vector_string {
  "data": string[];
  "metadata": LolTftPassRequestMetadataDTO;
}
export interface LolTftPassRequestMetadataDTO {
  "transactionId"?: string;
}
export interface LolTftPassResponseDTO_SvcRewardGrant {
  "data": LolTftPassSvcRewardGrant;
  "metadata": LolTftPassResponseMetadataDTO;
}
export interface LolTftPassResponseDTO_map_RewardGroupId_SelectGrantStatus {
  "data": Record<string, LolTftPassSelectGrantStatusResponse>;
  "metadata": LolTftPassResponseMetadataDTO;
}
export interface LolTftPassResponseDTO_vector_SvcRewardGrant {
  "data": LolTftPassSvcRewardGrant[];
  "metadata": LolTftPassResponseMetadataDTO;
}
export interface LolTftPassResponseDTO_vector_SvcRewardGroup {
  "data": LolTftPassSvcRewardGroup[];
  "metadata": LolTftPassResponseMetadataDTO;
}
export interface LolTftPassResponseMetadataDTO {
}
export interface LolTftPassReward {
  "id": string;
  "itemId": string;
  "itemType": string;
  "quantity": number;
  "fulfillmentSource": string;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolTftPassRewardGrant {
  "info": LolTftPassSvcRewardGrant;
  "rewardGroup": LolTftPassSvcRewardGroup;
}
export type LolTftPassRewardStatus = "FAILED" | "FULFILLED" | "PENDING";
export type LolTftPassRewardStrategy = "ALL" | "RANDOM" | "SELECTION";
export interface LolTftPassRewardTrack {
  "trackConfig": LolTftPassRewardTrackConfiguration;
}
export interface LolTftPassRewardTrackConfiguration {
  "id": string;
  "premiumEntitlement": LolTftPassPremiumEntitlement;
}
export interface LolTftPassRewardTrackError {
  "errorMessage": string;
  "errorId": string;
}
export interface LolTftPassRewardTrackItem {
  "state": LolTftPassRewardTrackItemStates;
  "rewardOptions": LolTftPassRewardTrackItemOption[];
  "rewardTags": LolTftPassRewardTrackItemTag[];
  "progressRequired": number;
  "threshold": string;
}
export type LolTftPassRewardTrackItemHeaderType = "FREE" | "NONE" | "PREMIUM";
export interface LolTftPassRewardTrackItemOption {
  "state": LolTftPassRewardTrackItemStates;
  "thumbIconPath": string;
  "splashImagePath": string;
  "selected": boolean;
  "overrideFooter": string;
  "headerType": LolTftPassRewardTrackItemHeaderType;
  "rewardName": string;
  "rewardDescription": string;
  "rewardItemType": string;
  "rewardItemId": string;
  "rewardFulfillmentSource": string;
  "cardSize": string;
  "rewardGroupId": string;
  "celebrationType": LolTftPassCelebrationType;
  "rewardInventoryTypes": string[];
}
export type LolTftPassRewardTrackItemStates = "Locked" | "Selected" | "Unlocked" | "Unselected";
export type LolTftPassRewardTrackItemTag = "Choice" | "Free" | "Instant" | "Multiple" | "Rare";
export interface LolTftPassRewardTrackProgress {
  "level": number;
  "totalLevels": number;
  "levelProgress": number;
  "futureLevelProgress": number;
  "passProgress": number;
  "currentLevelXP": number;
  "totalLevelXP": number;
  "iteration": number;
}
export interface LolTftPassRewardTrackXP {
  "currentLevel": number;
  "currentLevelXP": number;
  "totalLevelXP": number;
  "isBonusPhase": boolean;
  "iteration": number;
}
export interface LolTftPassRewardsCatalogPluginItem {
  "itemId": number;
  "name": string;
  "itemInstanceId": string;
  "owned": boolean;
  "rarity": string;
  "active": boolean;
  "questSkinInfo": LolTftPassRewardsSkinLineInfo;
}
export interface LolTftPassRewardsCatalogPluginItemAssets {
  "splashPath": string;
  "loadScreenPath": string;
}
export interface LolTftPassRewardsCatalogPluginItemWithDetails {
  "item": LolTftPassRewardsCatalogPluginItem;
  "assets": LolTftPassRewardsCatalogPluginItemAssets;
}
export interface LolTftPassRewardsConfig {
  "GrantFiltering": boolean;
}
export interface LolTftPassRewardsSkinLineInfo {
  "tiers": LolTftPassRewardsSkinLineTier[];
  "mostProgressedSkinTier": LolTftPassRewardsSkinLineTier;
  "productType": string;
}
export interface LolTftPassRewardsSkinLineTier {
  "stage": number;
  "name": string;
  "uncenteredSplashPath": string;
  "ownership": LolTftPassRewardsSkinLineTierOwnership;
}
export interface LolTftPassRewardsSkinLineTierOwnership {
  "owned": boolean;
}
export interface LolTftPassRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolTftPassRmsEntitlementPayload {
  "itemId": string;
  "itemTypeId": string;
  "tiers": string;
  "entitlementTypeId": string;
  "resourceOperation": string;
}
export interface LolTftPassRmsStoreEntitlementItem {
  "inventoryType": string;
  "itemId": string;
}
export interface LolTftPassRmsStoreEntitlementPayload {
  "transactionId": string;
  "items": LolTftPassRmsStoreEntitlementItem[];
}
export interface LolTftPassRmsWalletPayload {
}
export interface LolTftPassRmsXboxSubscriptionChange {
  "puuid": string;
  "subscriptionId": string;
  "active": string;
  "identityProvider": string[];
}
export interface LolTftPassSeasonPass {
  "eventId": string;
  "eventHubType": string;
  "localizedName": string;
  "navbarIconImage": string;
  "battleExpIconImage": string;
  "headerTitleImage": string;
  "startDate": string;
  "progressEndDate": string;
  "endDate": string;
  "helpModalImage": string;
  "eventPassBundlesCatalogEntry": LolTftPassCatalogEntry[];
  "progressionPurchaseCatalogEntry": LolTftPassCatalogEntry;
  "rewardTrack": LolTftPassRewardTrack;
  "localizedUpsellTitle": string;
  "localizedUpsellTooltipTitle": string;
  "localizedUpsellTooltipDescription": string;
  "localizedUpsellButtonText": string;
  "upsellBackgroundImageUrl": string;
  "upsellTooltipBackgroundImageUrl": string;
  "objectiveBannerImage": string;
  "seasonPassSubType": string;
  "localizedSeasonLogo": string;
  "localizedShortName": string;
  "chapters": LolTftPassChapter[];
  "actBackgroundImage": string;
}
export type LolTftPassSeasonPassSubType = "Default" | "Mayhem";
export type LolTftPassSelectGrantStatusResponse = "FAILED" | "SELECTED";
export interface LolTftPassSelectionRequestDTO {
  "grantId": string;
  "rewardGroupId": string;
  "selections": string[];
}
export interface LolTftPassSelectionStrategyConfig {
  "minSelectionsAllowed": number;
  "maxSelectionsAllowed": number;
}
export interface LolTftPassSimpleInventoryDTO {
  "items": Record<string, unknown>;
  "itemsJwt": string;
  "expires": string;
}
export interface LolTftPassSimpleInventoryResponseDTO {
  "data": LolTftPassSimpleInventoryDTO;
}
export interface LolTftPassSpotlightSkin {
  "championSkinID": number;
}
export interface LolTftPassSummonerIcon {
  "itemId": number;
}
export interface LolTftPassSvcRewardGrant {
  "id": string;
  "granteeId": string;
  "rewardGroupId": string;
  "dateCreated": string;
  "status": LolTftPassGrantStatus;
  "grantElements": LolTftPassSvcRewardGrantElement[];
  "selectedIds": string[];
  "viewed": boolean;
  "grantorDescription": LolTftPassGrantorDescription;
  "messageParameters": Record<string, unknown>;
}
export interface LolTftPassSvcRewardGrantElement {
  "elementId": string;
  "itemId": string;
  "itemType": string;
  "fulfillmentSource": string;
  "status": LolTftPassRewardStatus;
  "quantity": number;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
}
export interface LolTftPassSvcRewardGroup {
  "id": string;
  "productId": string;
  "types": string[];
  "rewards": LolTftPassReward[];
  "childRewardGroupIds": string[];
  "rewardStrategy": LolTftPassRewardStrategy;
  "selectionStrategyConfig"?: LolTftPassSelectionStrategyConfig;
  "active": boolean;
  "media": Record<string, string>;
  "localizations": Record<string, string>;
  "celebrationType": LolTftPassCelebrationType;
}
export interface LolTftPassTFTPassAsset {
  "internalName": string;
  "iconTexturePath": string;
  "iconNeedsFrame": boolean;
}
export interface LolTftPassTFTPassClientConfig {
  "battlePassId": string;
  "eventPassId": string;
  "dailyLoginPassId": string;
  "skillTreePassId": string;
  "pmUltimateVictoryPassId": string;
}
export interface LolTftPassTFTPassDTO {
  "id": string;
  "counterID": string;
  "productID": string;
  "playerID": string;
  "title": string;
  "premiumTitle": string;
  "description": string;
  "activationTimeMS": number;
  "deactivationTimeMS": number;
  "assetID": string;
  "currentLevel": number;
  "totalPointsEarned": number;
  "premiumEntitlementID": string;
  "storePurchaseIDs": Record<string, string>;
  "milestones": LolTftPassTFTPassMilestoneDTO[];
  "hasLevelPurchasing": boolean;
  "status": string;
}
export interface LolTftPassTFTPassMilestoneDTO {
  "id": string;
  "title": string;
  "description": string;
  "assetInternalName": string;
  "keystone": boolean;
  "bonus": boolean;
  "level": number;
  "pointsNeededForMilestone": number;
  "totalPointsNeededForMilestone": number;
  "pointsEarnedForMilestone": number;
  "status": string;
  "rewards": LolTftPassTFTPassRewardDTO[];
}
export interface LolTftPassTFTPassRewardDTO {
  "title": string;
  "description": string;
  "assetInternalName": string;
  "itemId": string;
  "itemTypeId": string;
  "premium": boolean;
}
export interface LolTftPassTFTPassRewardNotification {
  "title": string;
  "description": string;
  "iconURL": string;
  "framedIcon": boolean;
}
export interface LolTftPassTftBattlepass {
  "totalPointsEarned": number;
  "milestones": LolTftPassTftBattlepassMilestone[];
  "bonuses": LolTftPassTftBattlepassMilestone[];
  "activeMilestone": LolTftPassTftBattlepassMilestone;
  "info": LolTftPassTftBattlepassInfo;
  "lastViewedProgress": number;
  "lastViewedMilestone": LolTftPassTftBattlepassMilestone;
  "currentLevel": number;
}
export interface LolTftPassTftBattlepassInfo {
  "title": string;
  "description": string;
  "startDate": number;
  "endDate": number;
  "premium": boolean;
  "premiumTitle": string;
  "premiumEntitlementId": string;
  "pcPurchaseRequirement": string;
  "passId": string;
  "hasLevelPurchasing": boolean;
  "media": Record<string, string>;
  "passType": LolTftPassTftPassType;
}
export interface LolTftPassTftBattlepassMilestone {
  "milestoneId": string;
  "title": string;
  "description": string;
  "status": string;
  "pointsNeededForMilestone": number;
  "pointsEarnedForMilestone": number;
  "totalPointsForMilestone": number;
  "level": number;
  "iconImageUrl": string;
  "iconNeedsFrame": boolean;
  "rewards": LolTftPassTftBattlepassReward[];
  "isPaid": boolean;
  "isLocked": boolean;
  "isKeystone": boolean;
  "isBonus": boolean;
  "isClaimRequestPending": boolean;
}
export interface LolTftPassTftBattlepassReward {
  "name": string;
  "description": string;
  "itemId": string;
  "itemTypeId": string;
  "iconUrl": string;
  "iconNeedsFrame": boolean;
}
export type LolTftPassTftPassType = "kBattlePass" | "kDailyLoginPass" | "kEventPass" | "kSkillTreePass" | "kUnknown";
export interface LolTftPassTokenShop {
  "tokenImage": string;
  "tokenName": string;
  "tokenUuid": string;
  "offers": LolTftPassOffer[];
  "contentDrops": LolTftPassContentDrop[];
  "tokenBundlesCatalogEntry": LolTftPassCatalogEntry[];
}
export interface LolTftPassTrackProgressNextReward {
  "currentXP": number;
  "nextLevelXP": number;
  "currentLevel": number;
  "nextReward": LolTftPassNextRewardUIData;
}
export interface LolTftPassTransactionResponseDTO {
  "id": string;
  "inventoryType": string;
  "itemId": number;
}
export interface LolTftPassTrigger {
  "type": string;
  "counterId": string;
  "entitlementItemId": string;
  "triggerValue": number;
}
export interface LolTftPassUnclaimedRewardsUIData {
  "rewardsCount": number;
  "lockedTokensCount": number;
  "timeOfLastUnclaimedReward": number;
}
export interface LolTftPassWallet {
  "ip": number;
  "rp": number;
}
export interface LolTftPassWalletCacheEntry {
  "signedBalancesJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolTftPassWalletDTO {
  "puuid": string;
  "accountId": number;
  "expires": string;
  "balances": Record<string, number>;
  "balancesJwt": string;
}
export interface LolTftPassWalletResponseDTO {
  "data": LolTftPassWalletDTO;
}
export interface LolTftPassWalletUpdateNotification {
  "receivedAtMs": number;
  "amount": number;
  "currencyType": string;
}
export interface LolTftPassXboxSubscriptionStatus {
  "active": string;
  "subscriptionId": string;
}
export interface LolTftPublishingSettings {
  "publishingLocale": string;
}
export interface LolTftQueue {
  "id": number;
  "mapId": number;
  "gameMode": string;
  "category": LolTftQueueGameCategory;
}
export type LolTftQueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface LolTftSettingsResource {
  "data": unknown;
}
export interface LolTftSkillTreeAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolTftSkillTreeCreateLoadoutDTO {
  "scope": string;
  "itemId"?: number;
  "name": string;
  "loadout": Record<string, LolTftSkillTreeItemKey>;
  "refreshTime": string;
}
export interface LolTftSkillTreeCreateLoadoutRequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": LolTftSkillTreeCreateLoadoutDTO;
}
export interface LolTftSkillTreeCreateOrUpdateItemsRequest {
  "id": number;
  "items": Record<string, unknown>;
  "inventoryJWTs": string[];
}
export interface LolTftSkillTreeEventSkill {
  "id": string;
  "itemId": number;
  "name": string;
  "description": string;
  "texture": string;
  "owned": boolean;
  "equipped": boolean;
}
export interface LolTftSkillTreeEventSkillPlayerProgression {
  "rank": number;
  "currDivision": number;
  "divisionEventPoints": number;
  "totalEventPoints": number;
  "lastViewedTotalEventPoints": number;
}
export interface LolTftSkillTreeEventSkillRankReward {
  "id": string;
  "name": string;
  "description": string;
  "texture": string;
}
export type LolTftSkillTreeEventSkillRankState = "kClaimable" | "kClaimed" | "kClaiming" | "kError" | "kUnclaimable";
export interface LolTftSkillTreeEventSkillTree {
  "name": string;
  "ranks": LolTftSkillTreeEventSkillTreeRank[];
}
export interface LolTftSkillTreeEventSkillTreeData {
  "eventSkillTree": LolTftSkillTreeEventSkillTree;
  "playerProgression": LolTftSkillTreeEventSkillPlayerProgression;
}
export interface LolTftSkillTreeEventSkillTreeRank {
  "state": LolTftSkillTreeEventSkillRankState;
  "numDivisions": number;
  "totalEventPointsForRank": number;
  "rankId": string;
  "name": string;
  "texture": string;
  "skills": LolTftSkillTreeEventSkill[];
  "rewards": LolTftSkillTreeEventSkillRankReward[];
}
export interface LolTftSkillTreeFrontendInventoryResponse {
  "entitlements": LolTftSkillTreeItemKey[];
}
export interface LolTftSkillTreeGameflowGameData {
  "queue": LolTftSkillTreeQueue;
}
export type LolTftSkillTreeGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolTftSkillTreeGameflowSession {
  "phase": LolTftSkillTreeGameflowPhase;
  "gameData": LolTftSkillTreeGameflowGameData;
}
export interface LolTftSkillTreeGetItemsRequest {
  "id": number;
  "inventoryTypes": string[];
  "inventoryJWTs": string[];
}
export interface LolTftSkillTreeInventoryDTO {
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "items": Record<string, unknown>;
  "expires": string;
  "itemsJwt"?: string;
}
export interface LolTftSkillTreeInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "f2p": boolean;
  "rental": boolean;
  "lsb": boolean;
  "wins": number;
}
export interface LolTftSkillTreeInventoryResponseDTO {
  "data": LolTftSkillTreeInventoryDTO;
}
export interface LolTftSkillTreeItemKey {
  "inventoryType": string;
  "contentId": string;
  "itemId": number;
  "data": Record<string, string>;
}
export interface LolTftSkillTreeLoadout {
  "id": number;
  "name": string;
  "items": Record<string, unknown>;
}
export interface LolTftSkillTreeLoadoutRequestDTOBase {
  "serviceToJwtsMap": Record<string, unknown>;
}
export interface LolTftSkillTreeLoginSession {
  "state": LolTftSkillTreeLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
  "puuid": string;
}
export type LolTftSkillTreeLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolTftSkillTreeQueue {
  "isTeamBuilderManaged": boolean;
}
export interface LolTftSkillTreeScopedLoadout {
  "scope": string;
  "itemId"?: number;
  "name": string;
  "loadout": Record<string, LolTftSkillTreeItemKey>;
  "refreshTime": string;
  "id": string;
}
export interface LolTftSkillTreeSignGCORequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": Record<string, LolTftSkillTreeItemKey>;
}
export interface LolTftSkillTreeTFTEventSkillData {
  "ContentId": string;
  "ItemId": number;
  "Name": string;
  "Description": string;
  "IconTexturePath": string;
}
export interface LolTftSkillTreeTFTEventSkillTreeData {
  "Name": string;
  "Ranks": LolTftSkillTreeTFTEventSkillTreeRankData[];
}
export interface LolTftSkillTreeTFTEventSkillTreeRankData {
  "Name": string;
  "IconTexturePath": string;
  "NumDivisions": number;
  "Skills": LolTftSkillTreeTFTEventSkillData[];
}
export interface LolTftSkillTreeTftBattlepass {
  "totalPointsEarned": number;
  "milestones": LolTftSkillTreeTftBattlepassMilestone[];
  "bonuses": LolTftSkillTreeTftBattlepassMilestone[];
  "activeMilestone": LolTftSkillTreeTftBattlepassMilestone;
  "info": LolTftSkillTreeTftBattlepassInfo;
  "lastViewedProgress": number;
  "lastViewedMilestone": LolTftSkillTreeTftBattlepassMilestone;
  "currentLevel": number;
}
export interface LolTftSkillTreeTftBattlepassInfo {
  "title": string;
  "description": string;
  "startDate": number;
  "endDate": number;
  "premium": boolean;
  "premiumTitle": string;
  "premiumEntitlementId": string;
  "pcPurchaseRequirement": string;
  "passId": string;
  "hasLevelPurchasing": boolean;
  "media": Record<string, string>;
  "passType": LolTftSkillTreeTftPassType;
}
export interface LolTftSkillTreeTftBattlepassMilestone {
  "milestoneId": string;
  "title": string;
  "description": string;
  "status": string;
  "pointsNeededForMilestone": number;
  "pointsEarnedForMilestone": number;
  "totalPointsForMilestone": number;
  "level": number;
  "iconImageUrl": string;
  "iconNeedsFrame": boolean;
  "rewards": LolTftSkillTreeTftBattlepassReward[];
  "isPaid": boolean;
  "isLocked": boolean;
  "isKeystone": boolean;
  "isBonus": boolean;
  "isClaimRequestPending": boolean;
}
export interface LolTftSkillTreeTftBattlepassReward {
  "name": string;
  "description": string;
  "itemId": string;
  "itemTypeId": string;
  "iconUrl": string;
  "iconNeedsFrame": boolean;
}
export type LolTftSkillTreeTftPassType = "kBattlePass" | "kDailyLoginPass" | "kEventPass" | "kSkillTreePass" | "kUnknown";
export interface LolTftSkillTreeUpdateLoadoutDTO {
  "id": string;
  "name": string;
  "loadout": Record<string, LolTftSkillTreeItemKey>;
}
export interface LolTftSkillTreeUpdateLoadoutRequestDTO {
  "serviceToJwtsMap": Record<string, unknown>;
  "loadout": LolTftSkillTreeUpdateLoadoutDTO;
}
export interface LolTftTFTRotatingShopPromo {
  "id": string;
  "bundleId": string;
  "storeType": string;
  "isDeepLink": boolean;
}
export interface LolTftTFTRotatingShopPromos {
  "firstPromos": LolTftTFTRotatingShopPromo[];
  "secondPromos": LolTftTFTRotatingShopPromo[];
  "fallbackPromo": LolTftTFTRotatingShopPromo;
}
export interface LolTftTeamPlannerChampion {
  "championId": string;
}
export interface LolTftTeamPlannerGameDataTFTSets {
  "LCTFTModeData": LolTftTeamPlannerTFTModeData;
}
export interface LolTftTeamPlannerGameflowGameData {
  "queue": LolTftTeamPlannerQueue;
}
export type LolTftTeamPlannerGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolTftTeamPlannerGameflowSession {
  "phase": LolTftTeamPlannerGameflowPhase;
  "gameData": LolTftTeamPlannerGameflowGameData;
}
export interface LolTftTeamPlannerImportedTeamCodeChampionData {
  "championId": string;
  "icon": string;
  "price": number;
}
export interface LolTftTeamPlannerImportedTeamCodeData {
  "teamCode": string;
  "teamPlan": LolTftTeamPlannerImportedTeamCodeChampionData[];
}
export interface LolTftTeamPlannerNamecheckAuthorization {
  "subject": string;
}
export interface LolTftTeamPlannerNamecheckLoginDataPacket {
  "platformId": string;
}
export interface LolTftTeamPlannerNamecheckPayload {
  "name": string;
  "nameValidationContext": string;
  "puuid": string;
  "shard": string;
}
export interface LolTftTeamPlannerNamecheckResponse {
  "errors": string[];
}
export interface LolTftTeamPlannerPreviouslyUsedContext {
  "optionalTeamId": string;
  "setId": string;
  "sortOption": number;
  "viewId": number;
}
export interface LolTftTeamPlannerQueue {
  "gameMode": string;
}
export interface LolTftTeamPlannerSanitizeRequest {
  "texts": string[];
  "aggressiveScan"?: boolean;
}
export interface LolTftTeamPlannerSanitizeResponse {
  "modified": boolean;
}
export interface LolTftTeamPlannerSettingsStorageContainer {
  "data": LolTftTeamPlannerTeamSettings;
  "schemaVersion": number;
}
export interface LolTftTeamPlannerTFTChampionData {
  "character_id": string;
  "squareIconPath": string;
  "tier": number;
  "team_planner_code": number;
}
export interface LolTftTeamPlannerTFTMapSetData {
  "SetCoreName": string;
}
export interface LolTftTeamPlannerTFTModeData {
  "mDefaultSet": LolTftTeamPlannerTFTMapSetData;
  "mDefaultTeamPlannerSet": LolTftTeamPlannerTFTMapSetData;
  "mEventSet": LolTftTeamPlannerTFTMapSetData;
  "mDefaultTeamName": string;
  "mDefaultTeamNameNumbered": string;
}
export interface LolTftTeamPlannerTFTTeamPlannerConfig {
  "enabled": boolean;
  "multipleSetsEnabled": boolean;
  "tencentNameCheckEnabled": boolean;
  "globalNameSanitizationEnabled": boolean;
  "newPlayerPreferenceTypeEnabled": boolean;
}
export interface LolTftTeamPlannerTeamPlan {
  "champions": LolTftTeamPlannerChampion[];
  "id": string;
  "title": string;
  "timeOfCreationInMs": number;
  "timeOfLastViewInMs": number;
  "timeOfLastReminderToggleInMs": number;
  "setName": string;
  "teamIsImported": boolean;
  "editedByPlayer": boolean;
  "shownNewTeamAnim": boolean;
}
export interface LolTftTeamPlannerTeamSettings {
  "teams": LolTftTeamPlannerTeamPlan[];
  "teamMap": Record<string, LolTftTeamPlannerTeamsForSet>;
  "remindersEnabled": boolean;
  "registeredTeamIndex": number;
  "hasViewedTeamPlanner": boolean;
  "eventSetLastViewed": boolean;
  "previouslyUsedContext": LolTftTeamPlannerPreviouslyUsedContext;
}
export interface LolTftTeamPlannerTeamsForSet {
  "teams": LolTftTeamPlannerTeamPlan[];
  "registeredTeamIndex": number;
  "remindedTeamId": string;
}
export interface LolTftTeamPlannerValidateItemSetNameResponse {
  "success": boolean;
  "nameCheckResponse": LolTftTeamPlannerNamecheckResponse;
}
export interface LolTftTrovesCapCounterBalanceDto {
  "amount": number;
  "version": number;
  "active": boolean;
}
export interface LolTftTrovesCapDropsDropTableDisplayMetadata {
  "isCollectorsBounty": boolean;
  "dataAssetId": string;
  "nameTraKey": string;
  "progressionId": string;
  "priority": number;
  "tables": Record<string, LolTftTrovesOddsTableDisplayMetadata>;
  "version": number;
  "chaseContentId": string;
  "chaseContentIds": string[];
  "prestigeContentIds": string[];
  "bountyType": string;
  "oddsTree": LolTftTrovesDropsOddsTreeNodeDTO;
}
export interface LolTftTrovesCapOrdersRequestDTO {
  "data": unknown;
  "meta": LolTftTrovesCapOrdersRequestMetaDTO;
}
export interface LolTftTrovesCapOrdersRequestMetaDTO {
  "correlationId": string;
  "jwt": string;
  "xid": string;
}
export interface LolTftTrovesCapOrdersResponseDTO {
  "data": unknown;
}
export interface LolTftTrovesCatalogEntryDto {
  "id": string;
  "productId": string;
  "name": string;
  "description": string;
  "endTime": string;
  "purchaseUnits": LolTftTrovesPurchaseUnitDto[];
  "displayMetadata": unknown;
  "refundRule": string;
  "giftRule": string;
  "prerequisites": LolTftTrovesPrerequisiteDto[];
  "purchaseLimits": LolTftTrovesVelocityLimitDeltaDto[];
}
export interface LolTftTrovesChemtechShoppeDropTableOddsTreeDto {
  "nodeHierarchy": Record<string, LolTftTrovesChemtechShoppeDropTableOddsTreeHierarchyDto>;
  "nodes": Record<string, LolTftTrovesChemtechShoppeDropTableOddsTreeNodeDto>;
  "nodeTraKeys": Record<string, LolTftTrovesChemtechShoppeDropTableOddsTreeNodeTraKeyDto>;
  "rootNodeId": string;
  "templateName": string;
}
export interface LolTftTrovesChemtechShoppeDropTableOddsTreeHierarchyDto {
  "edges": LolTftTrovesChemtechShoppeDropTableOddsTreeHierarchyEdgeDto[];
}
export interface LolTftTrovesChemtechShoppeDropTableOddsTreeHierarchyEdgeDto {
  "targetNodeId": string;
  "odds": number;
}
export interface LolTftTrovesChemtechShoppeDropTableOddsTreeNodeDto {
  "id": string;
  "name": string;
  "displayPriority": number;
  "sourceId": string;
  "rewardQuantity": number;
}
export interface LolTftTrovesChemtechShoppeDropTableOddsTreeNodeTraKeyDto {
  "nameTraKey": string;
}
export interface LolTftTrovesChemtechShoppeDropTableOddsTreeResultDto {
  "data": LolTftTrovesChemtechShoppeDropTableOddsTreeDto;
}
export interface LolTftTrovesChemtechShoppeDropsFulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "ownershipCompensationMode": string;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
}
export interface LolTftTrovesChemtechShoppeDropsRollDto {
  "fulfillments": LolTftTrovesChemtechShoppeDropsFulfillmentDto[];
}
export interface LolTftTrovesChemtechShoppeDropsRollResultsDto {
  "rolls": LolTftTrovesChemtechShoppeDropsRollDto[];
}
export interface LolTftTrovesCompanionData {
  "name": string;
  "contentId": string;
  "speciesName": string;
  "companionType": string;
}
export interface LolTftTrovesCounter {
  "id": string;
  "name": string;
  "groupId": string;
  "direction": string;
  "startValue": number;
}
export interface LolTftTrovesCounterInstance {
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "counterValue": number;
}
export interface LolTftTrovesCounterNotificationResource {
  "balances": Record<string, LolTftTrovesCapCounterBalanceDto>;
  "deltas": Record<string, LolTftTrovesCapCounterBalanceDto>;
}
export interface LolTftTrovesDropCounterDTO {
  "dropTableId": string;
  "count": number;
}
export interface LolTftTrovesDropsDropTablePityInfo {
  "pityLimit": number;
  "chaseContentIds": string[];
}
export interface LolTftTrovesDropsDropTableWithPityDTO {
  "id": string;
  "sourceId": string;
  "productId": string;
  "startDate": string;
  "endDate": string;
  "currencyId": string;
  "rollOffer": string;
  "cost": number;
  "pityInfo": LolTftTrovesDropsDropTablePityInfo;
  "displayMetadata": LolTftTrovesCapDropsDropTableDisplayMetadata;
}
export interface LolTftTrovesDropsOddsListEntryDTO {
  "contentId": string;
  "nodeId": string;
  "sourceId": string;
}
export interface LolTftTrovesDropsOddsTreeNodeDTO {
  "nodeId": string;
  "sourceId": string;
  "odds": number;
  "children": LolTftTrovesDropsOddsTreeNodeDTO[];
  "quantity": number;
  "nameTraKey": string;
  "priority": number;
}
export interface LolTftTrovesEntitlementDto {
  "id": string;
  "label": string;
  "typeId": string;
  "productId": string;
  "active": boolean;
  "createdDate": string;
  "lastModifiedDate": string;
  "firstUsedDate": string;
  "recipient": unknown;
  "ownerId": string;
  "item": LolTftTrovesEntitlementItemDto;
}
export interface LolTftTrovesEntitlementItemDto {
  "id": string;
  "typeId": string;
}
export interface LolTftTrovesEntitlementNotificationResource {
  "itemId": string;
  "itemTypeId": string;
  "entitlementTypeId": string;
  "resourceOperation": string;
}
export interface LolTftTrovesEntitlementsResponse {
  "data": LolTftTrovesEntitlementDto[];
}
export interface LolTftTrovesEntityInstance {
  "schemaVersion": string;
  "groupId": string;
  "counters": LolTftTrovesCounterInstance[];
  "milestones": LolTftTrovesMilestoneInstance[];
}
export interface LolTftTrovesFinalPurchaseUnitDto {
  "payments": LolTftTrovesPaymentDto[];
  "fulfillment": LolTftTrovesFulfillmentDto;
}
export interface LolTftTrovesFulfillmentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "maxQuantity": number;
  "ownedQuantity": number;
  "ownershipCompensationMode": string;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
  "subCurrencyDeltas": Record<string, number>;
  "progressionCounterId": string;
  "dropTableId": string;
  "results": LolTftTrovesChemtechShoppeDropsRollResultsDto;
}
export interface LolTftTrovesGameDataCompanion {
  "contentId": string;
  "companionType": string;
}
export interface LolTftTrovesGameDataTFTContent {
  "name": string;
  "nameTraKey": string;
}
export interface LolTftTrovesGameDataTrovesBanner {
  "id": string;
  "activationTime": string;
  "deactivationTime": string;
  "pityThreshold": number;
  "bannerTexture": string;
  "thumbnailTexture": string;
  "backgroundTexture": string;
  "platformTexture": string;
  "eventHubBannerTexture": string;
  "name": string;
  "description": string;
  "isCollectorBounty": boolean;
  "celebrationTheme": LolTftTrovesTrovesCelebrationThemeData;
  "rootTable": LolTftTrovesGameDataTrovesBannerTable;
  "chaseTable": LolTftTrovesGameDataTrovesBannerTable;
}
export interface LolTftTrovesGameDataTrovesBannerReward {
  "itemInstanceId": string;
  "itemTypeId": string;
  "starLevel": number;
  "name": string;
  "quantity": number;
  "rarity": LolTftTrovesLootRarity;
  "currencyId": string;
  "rewardTexturePath": string;
  "highlightRewardAssetPath": string;
}
export interface LolTftTrovesGameDataTrovesBannerTable {
  "id": string;
  "key": string;
  "name": string;
  "loadoutsItem"?: LolTftTrovesLoadoutsItem;
  "children"?: LolTftTrovesGameDataTrovesBannerTableEntry[];
  "priority": number;
}
export interface LolTftTrovesGameDataTrovesBannerTableEntry {
  "bannerNode": LolTftTrovesGameDataTrovesBannerTable;
}
export interface LolTftTrovesGroup {
  "id": string;
  "schemaVersion": string;
  "productId": string;
  "name": string;
  "repeat": LolTftTrovesRepeat;
  "counters": LolTftTrovesCounter[];
  "milestones": LolTftTrovesMilestone[];
}
export interface LolTftTrovesInventoryItem {
  "uuid": string;
  "inventoryType": string;
  "owned": boolean;
}
export interface LolTftTrovesLoadoutsItem {
  "itemInstanceId": string;
  "itemTypeId": string;
  "name": string;
  "starLevel": number;
}
export interface LolTftTrovesLoginSession {
  "state": LolTftTrovesLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
  "puuid": string;
}
export type LolTftTrovesLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolTftTrovesLootOddsResponse {
  "lootId": string;
  "parentId": string;
  "dropRate": number;
  "quantity": number;
  "label": string;
  "query": string;
  "displayPriority": number;
  "children": LolTftTrovesLootOddsResponse[];
}
export type LolTftTrovesLootRarity = "Default" | "Epic" | "Legendary" | "Mythic" | "Ultimate";
export interface LolTftTrovesMilestone {
  "id": string;
  "name": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "properties": Record<string, string>;
  "triggers": LolTftTrovesTrigger[];
  "triggerRequirement": string;
}
export interface LolTftTrovesMilestoneInstance {
  "milestoneId": string;
  "instanceId": string;
  "ownerId": string;
  "productId": string;
  "groupId": string;
  "counterId": string;
  "triggerValue": number;
  "repeatSequence": number;
  "triggered": boolean;
  "triggeredTimestamp": string;
  "triggers": LolTftTrovesTrigger[];
}
export interface LolTftTrovesOddsTableDisplayMetadata {
  "nameTraKey": string;
  "priority": number;
}
export interface LolTftTrovesOrderNotificationResource {
  "eventTypeId": string;
  "eventType": string;
  "status": string;
}
export interface LolTftTrovesPagination {
  "offset": number;
  "limit": number;
  "maxLimit": number;
  "total": number;
  "previous": string;
  "next": string;
}
export interface LolTftTrovesPaymentDto {
  "delta": number;
  "finalDelta": number;
  "name": string;
  "discountedDelta": number;
  "discountPercent": number;
  "itemTypeId": string;
  "itemId": string;
  "currencyId": string;
}
export interface LolTftTrovesPaymentOptionDto {
  "key": string;
  "payments": LolTftTrovesPaymentDto[];
}
export interface LolTftTrovesPityCounterDTO {
  "dropTableId": string;
  "count": number;
}
export interface LolTftTrovesPlayerLoot {
  "lootName": string;
  "localizedName": string;
  "itemDesc": string;
}
export interface LolTftTrovesPrerequisiteDto {
  "status": string;
  "itemTypeId": string;
  "itemId": string;
  "requiredQuantity": number;
}
export interface LolTftTrovesPurchaseDto {
  "id": string;
  "productId": string;
  "storeId": string;
  "storeName": string;
  "catalogEntryId": string;
  "catalogEntryName": string;
  "purchaserId": string;
  "recipientId": string;
  "purchaseUnits": LolTftTrovesFinalPurchaseUnitDto[];
  "createdTime": string;
  "completedTime": string;
  "purchaseState": string;
  "purchaseVisibility": string;
  "refund": LolTftTrovesRefundDto;
  "refundRule": string;
  "refundable": boolean;
  "quantity": number;
  "source": string;
}
export interface LolTftTrovesPurchaseErrorMessageDto {
  "httpStatus": number;
  "errorCode": string;
  "message": string;
}
export interface LolTftTrovesPurchaseHistoryResponse {
  "data": LolTftTrovesPurchaseDto[];
  "paging": LolTftTrovesPagination;
  "stats": LolTftTrovesResponseStats;
  "notes": string[];
  "errors": LolTftTrovesResponseError[];
}
export interface LolTftTrovesPurchaseRequest {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "quantity": number;
}
export interface LolTftTrovesPurchaseRequestDto {
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
  "idempotencyId": string;
  "source": string;
  "quantity": number;
}
export interface LolTftTrovesPurchaseResponse {
  "data": LolTftTrovesPurchaseDto;
  "paging": LolTftTrovesPagination;
  "stats": LolTftTrovesResponseStats;
  "notes": string[];
  "errors": LolTftTrovesResponseError[];
}
export interface LolTftTrovesPurchaseTransaction {
  "purchaseId": string;
  "productId": string;
  "storeId": string;
  "catalogEntryId": string;
  "purchaseState": string;
  "refundId": string;
  "refundState": string;
}
export interface LolTftTrovesPurchaseUnitDto {
  "paymentOptions": LolTftTrovesPaymentOptionDto[];
  "payment": LolTftTrovesPaymentDto[];
  "fulfillment": LolTftTrovesFulfillmentDto;
}
export interface LolTftTrovesRefundDto {
  "id": string;
  "purchaseId": string;
  "createdTime": string;
  "completedTime": string;
  "state": string;
  "source": string;
}
export interface LolTftTrovesRefundRequest {
  "purchaseId": string;
}
export interface LolTftTrovesRefundRequestDto {
  "purchaseId": string;
  "source": string;
}
export interface LolTftTrovesRefundResponse {
  "data": LolTftTrovesRefundDto;
  "paging": LolTftTrovesPagination;
  "stats": LolTftTrovesResponseStats;
  "notes": string[];
  "errors": LolTftTrovesResponseError[];
}
export interface LolTftTrovesRegionLocale {
  "region": string;
  "locale": string;
  "webRegion": string;
}
export interface LolTftTrovesRepeat {
  "count": number;
  "scope": number;
  "multiplier": number;
  "milestones": LolTftTrovesMilestone[];
  "repeatTriggers": LolTftTrovesRepeatGroupTrigger[];
}
export interface LolTftTrovesRepeatGroupTrigger {
  "type": string;
  "counterId": string;
  "startTriggerValue": number;
  "increaseBy": number;
  "multiplier": number;
}
export interface LolTftTrovesResponseError {
  "message": string;
  "type": string;
  "code": number;
}
export interface LolTftTrovesResponseStats {
  "durationMs": number;
}
export interface LolTftTrovesRewardsNotificationResource {
  "purchaserId": string;
  "recipientId": string;
  "transactionId": string;
  "rewardId": string;
  "rewardInstanceId": string;
  "status": string;
}
export interface LolTftTrovesRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolTftTrovesRotationalShopBundleData {
  "asset": string;
  "description": string;
  "descriptionKey": string;
  "title": string;
  "titleKey": string;
}
export interface LolTftTrovesRotationalShopBundleListData {
  "items": LolTftTrovesRotationalShopBundleData[];
}
export interface LolTftTrovesRotationalShopItemData {
  "backgroundTextureLCU": string;
  "contentID": string;
  "descriptionTraKey": string;
  "description": string;
  "name": string;
  "standaloneLoadoutsLargeIcon": string;
  "videoID": string;
  "redeemIconTexture": string;
  "rarity": string;
  "typeID": string;
  "speciesLink": string;
}
export interface LolTftTrovesStoreDto {
  "id": string;
  "productId": string;
  "name": string;
  "catalogEntries": LolTftTrovesCatalogEntryDto[];
  "displayMetadata": unknown;
  "startTime": string;
  "endTime": string;
}
export interface LolTftTrovesStoresResponse {
  "data": LolTftTrovesStoreDto[];
  "paging": LolTftTrovesPagination;
  "stats": LolTftTrovesResponseStats;
  "notes": string[];
  "errors": LolTftTrovesResponseError[];
}
export interface LolTftTrovesTFTRotationalShopConfig {
  "enabled": boolean;
  "contentPreviewConfig": unknown;
  "uiToggleEnabled": boolean;
  "navs": LolTftTrovesTFTRotationalShopNavConfig[];
  "refund": LolTftTrovesTFTRotationalShopRefundConfig;
  "littleLegendsUpgradeEnabled": boolean;
  "eventsStoreEnabled": boolean;
  "eventsStoreData": unknown;
  "eventsMusicDisabled": boolean;
}
export interface LolTftTrovesTFTRotationalShopNavConfig {
  "name": string;
  "enabled": boolean;
  "supportedCurrencies": string[];
}
export interface LolTftTrovesTFTRotationalShopRefundConfig {
  "enabled": boolean;
  "allowedTypes": string[];
  "thresholdDays": number;
}
export interface LolTftTrovesTraKeyName {
  "nameTraKey": string;
  "translatedName": string;
}
export interface LolTftTrovesTrigger {
  "type": string;
  "counterId": string;
  "entitlementItemId": string;
  "triggerValue": number;
}
export interface LolTftTrovesTrovePurchaseResponse {
  "orderId": string;
  "status": string;
  "errorCode": number;
  "data": unknown;
}
export interface LolTftTrovesTroves {
  "enabled": boolean;
  "capCatalogEnabled": boolean;
  "shoppeOddsTreeEnabled": boolean;
  "bannerList"?: LolTftTrovesTrovesActiveBanner[];
}
export interface LolTftTrovesTrovesActiveBanner {
  "id": string;
  "version": number;
  "videoId": string;
}
export interface LolTftTrovesTrovesBanner {
  "id": string;
  "version": number;
  "sourceId": string;
  "startDate": string;
  "endDate": string;
  "pityLimit": number;
  "pityCounterId": string;
  "rollOffer": string;
  "bannerTexture": string;
  "thumbnailTexture": string;
  "backgroundTexture": string;
  "platformTexture": string;
  "eventHubBannerTexture": string;
  "name": string;
  "description": string;
  "isCollectorBounty": boolean;
  "isStandardBounty": boolean;
  "maxTotalRolls": number;
  "pullCost": number;
  "chaseContentIds": string[];
  "prestigeContentIds": string[];
  "celebrationTheme": LolTftTrovesTrovesCelebrationThemeData;
  "status": LolTftTrovesTrovesStatus;
  "bountyType": string;
  "videoId": string;
  "storeId": string;
  "catalogEntryId": string;
  "paymentOptionsKeys": string[];
}
export interface LolTftTrovesTrovesCelebrationCurrencySegmentData {
  "lottieJsonPath": string;
  "singlePullSoundPath": string;
  "multiPullSoundPath": string;
  "mythicPullSoundPath": string;
}
export interface LolTftTrovesTrovesCelebrationHighlightSegmentData {
  "lottieJsonPath": string;
  "revealSoundPath": string;
  "transitionWipeSoundPath": string;
}
export interface LolTftTrovesTrovesCelebrationPortalSegmentData {
  "singlePullRareWebmPath": string;
  "singlePullEpicWebmPath": string;
  "singlePullLegendaryWebmPath": string;
  "singlePullMythicWebmPath": string;
  "singlePullSoundPath": string;
  "multiPullRareWebmPath": string;
  "multiPullEpicWebmPath": string;
  "multiPullLegendaryWebmPath": string;
  "multiPullMythicWebmPath": string;
  "multiPullSoundPath": string;
}
export interface LolTftTrovesTrovesCelebrationStandardSegmentData {
  "FirstItemTimingOffset": number;
  "InterItemTimingOffset": number;
  "PCHeaderText": string;
  "PCButtonText": string;
  "PCBackgroundPath": string;
  "PCRewardFramePath": string;
  "PCRewardOneStarPath": string;
  "PCRewardTwoStarPath": string;
  "PCRewardThreeStarPath": string;
  "PCRewardRareGemPath": string;
  "PCRewardEpicGemPath": string;
  "PCRewardLegendaryGemPath": string;
  "PCRewardMythicGemPath": string;
  "pullSingleIndividualGlintSoundPath": string;
  "pullSingleIndividualGlintLegendarySoundPath": string;
  "revealGlobalSoundPath": string;
  "revealEpicSoundPath": string;
  "revealMythicSoundPath": string;
  "revealRareSoundPath": string;
  "PCRewardFadeInDuration": number;
  "PCRewardFadeInDelay": number;
  "PCThumbnailFadeInDuration": number;
  "PCThumbnailFadeInDelay": number;
  "PCRewardSheenPath": string;
  "PCRewardSheenDuration": number;
  "PCRewardSheenDelay": number;
  "PCGlintSprite": LolTftTrovesTrovesPCSpriteAnimation;
  "PCLegendarySparkSprite": LolTftTrovesTrovesPCSpriteAnimation;
  "PCLegendaryHitSprite": LolTftTrovesTrovesPCSpriteAnimation;
}
export interface LolTftTrovesTrovesCelebrationThemeData {
  "currencySegmentData": LolTftTrovesTrovesCelebrationCurrencySegmentData;
  "portalSegmentData": LolTftTrovesTrovesCelebrationPortalSegmentData;
  "highlightSegmentData": LolTftTrovesTrovesCelebrationHighlightSegmentData;
  "standardSegmentData": LolTftTrovesTrovesCelebrationStandardSegmentData;
}
export interface LolTftTrovesTrovesMilestone {
  "milestoneId": string;
  "currencyId": string;
  "currencyAmount": number;
  "instanceId": string;
  "triggerValue": number;
  "repeatSequence": number;
  "triggeredTimestamp": string;
  "triggered": boolean;
  "name": string;
  "iconURL": string;
  "resetValue": number;
}
export interface LolTftTrovesTrovesMilestoneCounter {
  "counterId": string;
  "counterValue": number;
  "startTriggerValue": number;
  "increaseBy": number;
  "multiplier": number;
  "resetValue": number;
}
export interface LolTftTrovesTrovesMilestones {
  "groupId": string;
  "name": string;
  "milestones": LolTftTrovesTrovesMilestone[];
  "counter": LolTftTrovesTrovesMilestoneCounter;
}
export interface LolTftTrovesTrovesOwnedStatus {
  "chaseContentId": string;
  "owned": boolean;
}
export interface LolTftTrovesTrovesPCSpriteAnimation {
  "spritesheetPath": string;
  "duration": number;
  "delay": number;
  "numRows": number;
  "numCols": number;
  "numFrames": number;
  "startFrame": number;
  "fps": number;
  "maxPlayCount": number;
  "playAtInsert": boolean;
}
export interface LolTftTrovesTrovesPurchaseRequest {
  "offerId": string;
  "quantity": number;
  "paymentOption": string;
}
export interface LolTftTrovesTrovesReward {
  "name": string;
  "itemId": string;
  "itemTypeId": string;
  "quantity": number;
  "rarity": LolTftTrovesLootRarity;
  "rewardTexturePath": string;
  "highlightRewardAssetPath": string;
  "starLevel": number;
}
export interface LolTftTrovesTrovesRewards {
  "highlight": LolTftTrovesTrovesReward[];
  "standard": LolTftTrovesTrovesReward[];
}
export interface LolTftTrovesTrovesRewardsResponse {
  "orderId": string;
  "pullType": number;
  "rewards": LolTftTrovesTrovesRewards;
}
export interface LolTftTrovesTrovesRollRequest {
  "offerId": string;
  "numberOfRolls": number;
  "isMythic": boolean;
  "dropTableId": string;
}
export interface LolTftTrovesTrovesStatus {
  "ownedStatus": LolTftTrovesTrovesOwnedStatus[];
  "dropTableId": string;
  "hasPullError": boolean;
  "totalRollsCount": number;
  "isCollectorBountyMaxRollsMet": boolean;
  "pityCount": number;
}
export interface LolTftTrovesTrovesTable {
  "nameTraKey": string;
  "translatedName": string;
}
export interface LolTftTrovesVelocityLimitDeltaDto {
  "ruleId": string;
  "delta": number;
  "remaining": number;
}
export interface LolTftTrovesVelocityLimiterDto {
  "availableTokens": number;
  "refill": string;
}
export interface LolTftTrovesVerboseLootOddsResponse {
  "recipeName": string;
  "chanceToContain": LolTftTrovesLootOddsResponse[];
  "guaranteedToContain": LolTftTrovesLootOddsResponse[];
  "lootItem": LolTftTrovesPlayerLoot;
  "hasPityRules": boolean;
  "checksOwnership": boolean;
}
export interface LolTrophiesCapClashTrophyEntitlementPayload {
  "rewardSpec": LolTrophiesClashV2TrophyRewardSpec;
  "rewardType": string;
}
export interface LolTrophiesClashV2TrophyRewardSpec {
  "pedestal": string;
  "cup": string;
  "gem": string;
  "theme": string;
  "tier": string;
  "bracket": string;
  "seasonId": string;
}
export interface LolTrophiesInventoryItemsByType {
  "TOURNAMENT_TROPHY": LolTrophiesTournamentTrophyInventoryItem[];
}
export interface LolTrophiesInventoryResponse {
  "items": LolTrophiesInventoryItemsByType;
}
export interface LolTrophiesLoadout {
  "id": string;
  "name": string;
  "scope": string;
  "loadout": Record<string, LolTrophiesLoadoutItem>;
}
export interface LolTrophiesLoadoutItem {
  "itemId": number;
  "inventoryType": string;
  "data": Record<string, string>;
}
export interface LolTrophiesOtherPlayerTrophyInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "payload": LolTrophiesCapClashTrophyEntitlementPayload;
}
export interface LolTrophiesTournamentTrophyInventoryItem {
  "payload": LolTrophiesCapClashTrophyEntitlementPayload;
  "purchaseDate": string;
}
export interface LolTrophiesTrophyProfileData {
  "theme": string;
  "tier": number;
  "bracket": number;
  "seasonId": number;
  "pedestal": string;
  "cup": string;
  "gem": string;
}
export type LolUserExperienceGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface LolUserExperienceGameflowSession {
  "phase": LolUserExperienceGameflowPhase;
}
export interface LolVanguardEntitlementsTokenResource {
  "accessToken": string;
  "token": string;
  "entitlements": string[];
}
export type LolVanguardGameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export type LolVanguardGameflowServiceErrorType = "PLAYER_LACKS_VANGUARD_SESSION";
export interface LolVanguardGameflowSession {
  "phase": LolVanguardGameflowPhase;
}
export interface LolVanguardLoginSession {
  "state": LolVanguardLoginSessionState;
  "summonerId": number;
  "accountId": number;
  "puuid": string;
}
export type LolVanguardLoginSessionState = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolVanguardMail {
  "mailId": string;
  "message": string;
  "state": string;
  "createdAt": number;
}
export interface LolVanguardVanguardMachineSpecs {
  "tpm2Enabled": boolean;
  "secureBootEnabled": boolean;
}
export interface LolVanguardVanguardSession {
  "state": LolVanguardVanguardSessionState;
  "vanguardStatus": number;
}
export type LolVanguardVanguardSessionState = "CONNECTED" | "ERROR" | "IN_PROGRESS";
export interface LolVanguardVanguardSystemCheckTelemetryEvent {
  "passedOsCheck": boolean;
  "passedSecureFeaturesCheck": boolean;
}
export interface LolYourshopAccessTokenResource {
  "token": string;
  "scopes": string[];
  "expiry": number;
}
export interface LolYourshopCatalogItem {
  "itemId": number;
  "inventoryType": string;
  "itemInstanceId"?: string;
}
export interface LolYourshopClientCacheClearMessageDTO {
  "regions": string[];
  "clearAll": boolean;
  "inventoryTypes": string[];
}
export interface LolYourshopCurrencyDTO {
  "amount": number;
  "subCurrencies": Record<string, number>;
}
export interface LolYourshopEndOfGameXp {
  "PER_WIN": number;
}
export interface LolYourshopEndOfGameXpNotification {
  "xp": LolYourshopEndOfGameXp;
}
export interface LolYourshopInventoryCacheEntry {
  "signedInventoryJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolYourshopInventoryDTO {
  "puuid": string;
  "accountId": number;
  "summonerId": number;
  "items": Record<string, unknown>;
  "expires": string;
  "itemsJwt": string;
}
export interface LolYourshopInventoryItem {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolYourshopItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "wins": number;
}
export interface LolYourshopInventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "expirationDate": string;
  "purchaseDate": string;
  "quantity": number;
  "ownedQuantity": number;
  "usedInGameDate": string;
  "entitlementId": string;
  "entitlementTypeId": string;
  "instanceId": string;
  "instanceTypeId": string;
  "payload": unknown;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "lsb": boolean;
  "wins": number;
}
export interface LolYourshopInventoryItemWithPayload {
  "uuid": string;
  "itemId": number;
  "inventoryType": string;
  "purchaseDate": string;
  "quantity": number;
  "ownershipType": LolYourshopItemOwnershipType;
  "usedInGameDate": string;
  "expirationDate": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "loyaltySources": string[];
  "owned": boolean;
  "wins": number;
  "payload": unknown;
}
export interface LolYourshopInventoryNotification {
  "id": number;
  "itemId": number;
  "inventoryType": string;
  "type": string;
  "acknowledged": boolean;
}
export interface LolYourshopInventoryResponseDTO {
  "data": LolYourshopInventoryDTO;
}
export interface LolYourshopItemKey {
  "inventoryType": string;
  "itemId": number;
}
export type LolYourshopItemOwnershipType = "F2P" | "LOYALTY" | "OWNED" | "RENTED";
export interface LolYourshopLoginSession {
  "state": LolYourshopLoginSessionStates;
  "summonerId": number;
  "accountId": number;
  "idToken": string;
  "puuid": string;
}
export type LolYourshopLoginSessionStates = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface LolYourshopLolInventoryType {
  "inventoryTypeId": string;
  "capInventoryTypeId": string;
}
export interface LolYourshopLoyaltyRewards {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": Record<string, number>;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export interface LolYourshopLoyaltyRewardsSimplified {
  "freeRewardedChampionsCount": number;
  "classicFreeRewardedChampionsCount": number;
  "championIds": number[];
  "freeRewardedSkinsCount": number;
  "classicFreeRewardedSkinsCount": number;
  "skinIds": number[];
  "ipBoost": number;
  "xpBoost": number;
  "loyaltyTFTMapSkinCount": number;
  "loyaltyTFTCompanionCount": number;
  "loyaltyTFTDamageSkinCount": number;
  "loyaltyTFTZoomSkinCount": number;
  "loyaltyMayhemBPAugmentsCount": number;
  "loyaltySources": Record<string, boolean>;
  "tftCompensationRewards": string[];
}
export type LolYourshopLoyaltyStatus = "CHANGE" | "DISABLED" | "EXPIRY" | "LEGACY" | "REVOKE" | "REWARDS_GRANT";
export interface LolYourshopLoyaltyStatusNotification {
  "status": LolYourshopLoyaltyStatus;
  "rewards": LolYourshopLoyaltyRewardsSimplified;
  "reloadInventory": boolean;
}
export interface LolYourshopOffer {
  "offerId": string;
  "inventoryType": string;
  "itemId": number;
  "originalPrice": number;
  "discountPrice": number;
  "name": string;
  "owned": boolean;
  "revealed": boolean;
  "expirationDate": string;
  "spotIndex": number;
}
export interface LolYourshopOfferData {
  "offers": LolYourshopOffer[];
  "promotion": LolYourshopPromotion;
}
export interface LolYourshopOfferId {
  "offerId": string;
}
export interface LolYourshopOfferIds {
  "offers": LolYourshopOfferId[];
}
export interface LolYourshopOfferRequest {
  "offerId": string;
}
export interface LolYourshopOfferRequests {
  "offers": LolYourshopOfferRequest[];
}
export interface LolYourshopPlayerNotification {
  "critical": boolean;
  "detailKey": string;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
  "iconUrl": string;
}
export interface LolYourshopPlayerPermissions {
  "useData": string;
}
export interface LolYourshopPromotion {
  "name": string;
  "startTime": string;
  "endTime": string;
}
export interface LolYourshopPurchaseItem {
  "offerId": string;
  "inventoryType": string;
  "itemId": number;
  "pricePaid": number;
  "orderId": string;
}
export type LolYourshopPurchaseOfferOrderStates = "FAIL" | "IN_PROGRESS" | "NOT_STARTED" | "SUCCESS";
export interface LolYourshopPurchaseOfferOrderStatus {
  "orderState": LolYourshopPurchaseOfferOrderStates;
  "message": string;
}
export interface LolYourshopPurchaseOfferOrderStatuses {
  "statuses": Record<string, LolYourshopPurchaseOfferOrderStatus>;
}
export interface LolYourshopPurchaseResponse {
  "items": LolYourshopPurchaseItem[];
  "wallet": LolYourshopWallet;
}
export interface LolYourshopRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface LolYourshopRmsEntitlementPayload {
  "itemId": string;
  "itemTypeId": string;
  "tiers": string;
  "entitlementTypeId": string;
  "resourceOperation": string;
}
export interface LolYourshopRmsStoreEntitlementItem {
  "inventoryType": string;
  "itemId": string;
}
export interface LolYourshopRmsStoreEntitlementPayload {
  "transactionId": string;
  "items": LolYourshopRmsStoreEntitlementItem[];
}
export interface LolYourshopRmsWalletPayload {
}
export interface LolYourshopRmsXboxSubscriptionChange {
  "puuid": string;
  "subscriptionId": string;
  "active": string;
  "identityProvider": string[];
}
export interface LolYourshopSimpleInventoryDTO {
  "items": Record<string, unknown>;
  "itemsJwt": string;
  "expires": string;
}
export interface LolYourshopSimpleInventoryResponseDTO {
  "data": LolYourshopSimpleInventoryDTO;
}
export interface LolYourshopSummonerIcon {
  "itemId": number;
}
export interface LolYourshopUIOffer {
  "id": string;
  "originalPrice": number;
  "discountPrice": number;
  "type": string;
  "skinName": string;
  "championId": number;
  "skinId": number;
  "owned": boolean;
  "revealed": boolean;
  "purchasing": boolean;
  "expirationDate": string;
}
export interface LolYourshopUIStatus {
  "hubEnabled": boolean;
  "name": string;
  "startTime": string;
  "endTime": string;
}
export interface LolYourshopWallet {
  "rp": number;
}
export interface LolYourshopWalletCacheEntry {
  "signedBalancesJwt": string;
  "expirationMS": number;
  "issuedAtMS": number;
  "receivedAtMS": number;
  "valid": boolean;
}
export interface LolYourshopWalletDTO {
  "puuid": string;
  "accountId": number;
  "expires": string;
  "balances": Record<string, number>;
  "balancesJwt": string;
}
export interface LolYourshopWalletResponseDTO {
  "data": LolYourshopWalletDTO;
}
export interface LolYourshopWalletUpdateNotification {
  "receivedAtMs": number;
  "amount": number;
  "currencyType": string;
}
export interface LolYourshopXboxSubscriptionStatus {
  "active": string;
  "subscriptionId": string;
}
export interface LolYourshopYourshopConfig {
  "Active": boolean;
  "activationSpreadSeconds": number;
  "firstActivationThresholdSeconds": number;
  "ThemedBackground": boolean;
  "PromotionName": string;
  "PromotionStartDate": string;
  "PromotionEndDate": string;
}
export interface LootItemClientDTO {
  "lootName": string;
  "asset": string;
  "type": string;
  "rarity": string;
  "value": number;
  "storeItemId": number;
  "upgradeLootName": string;
  "expiryTime": number;
  "tags": string;
  "displayCategories": string;
  "rentalSeconds": number;
  "rentalGames": number;
}
export interface LootItemListClientDTO {
  "lootItems": LootItemClientDTO[];
  "lastUpdate": number;
}
export interface LootLcdsClientConfigurationDTO {
  "lootItemsUsingBreakoutRecipeMenu": string[];
  "lootMaterialsToAlwaysRender": string[];
  "currenciesUsingCapWallets": string[];
  "disabledRedemptions": string[];
}
export interface LootLcdsLootDescriptionDTO {
  "lootName": string;
  "childLootTableNames": string[];
  "localizationMap": Record<string, string>;
  "localizationLongDescriptionMap": Record<string, string>;
}
export interface LootLcdsRecipeClientDTO {
  "recipeName": string;
  "type": string;
  "displayCategories": string;
  "crafterName": string;
  "slots": LootLcdsRecipeSlotClientDTO[];
  "outputs": LootLcdsRecipeOutputDTO[];
  "metadata": LootLcdsRecipeMetadata;
  "singleOpen": boolean;
}
export interface LootLcdsRecipeListClientDTO {
  "recipes": LootLcdsRecipeClientDTO[];
  "lastUpdate": number;
}
export interface LootLcdsRecipeMetadata {
  "guaranteedDescriptions": LootLcdsLootDescriptionDTO[];
  "bonusDescriptions": LootLcdsLootDescriptionDTO[];
  "tooltipsDisabled": boolean;
}
export interface LootLcdsRecipeOutputDTO {
  "lootName": string;
  "quantityExpression": string;
  "probability": number;
  "allowDuplicates": boolean;
}
export interface LootLcdsRecipeSlotClientDTO {
  "slotNumber": number;
  "query": string;
  "quantityExpression": string;
}
export interface LootNameRefId {
  "lootName": string;
  "refId": string;
}
export interface LootOddsDTO {
  "lootId": string;
  "parentId": string;
  "dropRate": number;
  "quantity": number;
  "label": string;
  "lootOrder": number;
  "children": LootOddsDTO[];
}
export interface LootProgressionRecipeConfiguration {
  "active": boolean;
  "progressionUuid": string;
  "recipeName": string;
  "activationTime": string;
  "deactivationTime": string;
  "counterUuid": string;
}
export interface MassCraftLootDTO {
  "clientId": string;
  "transactionId": string;
  "lootItems": CraftLootDTO[];
}
export interface MatchedPlayerDTO {
  "rosterId": string;
  "captain": PlayerInfoDTO;
  "players": PlayerInfoDTO[];
}
export interface MatchmakingLcdsBustedLeaver {
  "summoner": MatchmakingLcdsSummoner;
  "reasonFailed": string;
  "accessToken": string;
  "leaverPenaltyMillisRemaining": number;
}
export interface MatchmakingLcdsFailedJoinPlayer {
  "summoner": MatchmakingLcdsSummoner;
  "reasonFailed": string;
}
export interface MatchmakingLcdsGameDTO {
  "gameState": string;
  "statusOfParticipants": string;
  "terminatedCondition": string;
  "teamOne": MatchmakingLcdsPlayerParticipant[];
  "teamTwo": MatchmakingLcdsPlayerParticipant[];
}
export interface MatchmakingLcdsGameNotification {
  "type": string;
  "messageCode": string;
  "messageArgument": string;
}
export interface MatchmakingLcdsMatchMakerParams {
  "queueIds": number[];
  "team": number[];
  "invitationId"?: string;
  "lastMaestroMessage": string;
  "languages"?: string;
  "botDifficulty": string;
  "teamId": number;
}
export interface MatchmakingLcdsMatchMakerPayload {
  "LEAVER_BUSTER_ACCESS_TOKEN": string;
}
export interface MatchmakingLcdsPlayerParticipant {
  "summonerId": number;
}
export interface MatchmakingLcdsQueueDisabled {
  "summoner": MatchmakingLcdsSummoner;
  "reasonFailed": string;
  "queueId": number;
  "message": string;
}
export interface MatchmakingLcdsQueueDodger {
  "summoner": MatchmakingLcdsSummoner;
  "reasonFailed": string;
  "dodgePenaltyRemainingTime": number;
}
export interface MatchmakingLcdsQueueInfo {
  "queueId": number;
  "waitTime": number;
}
export interface MatchmakingLcdsQueueRestricted {
  "summoner": MatchmakingLcdsSummoner;
  "reasonFailed": string;
  "queueId": number;
  "message": string;
}
export interface MatchmakingLcdsQueueThrottled {
  "summoner": MatchmakingLcdsSummoner;
  "reasonFailed": string;
  "queueId": number;
  "message": string;
}
export interface MatchmakingLcdsSearchingForMatchNotification {
  "joinedQueues": MatchmakingLcdsQueueInfo[];
  "playerJoinFailures": unknown[];
}
export interface MatchmakingLcdsSummoner {
  "sumId": number;
  "name": string;
}
export interface MemberBanUnbanTournament {
  "tournamentId": number;
  "tournamentnameLocKey": string;
  "tournamentnameLocKeySecondary": string;
  "tournamentPhaseLockInTime": number;
}
export type MetricDataType = "bool" | "float" | "int" | "string" | "uint" | "unknown";
export interface MetricMetadata {
  "sample_window_ms": number;
  "type": MetricType;
  "data_type": MetricDataType;
  "alerts": MetricMetadataAlert[];
  "notify": MetricMetadataNotify;
  "units": string;
  "pretty_name": string;
  "category": string;
  "description": string;
  "destination": string;
  "info": string;
  "transientAggregation": AggregationType;
  "priority": MetricPriority;
  "period": number;
}
export interface MetricMetadataAlert {
  "level": string;
  "min": number;
  "max": number;
  "notify": MetricMetadataNotify;
  "pretty_name": string;
  "description": string;
  "info": string;
}
export interface MetricMetadataHipchatNotification {
  "roomid": string;
  "tags": string;
}
export interface MetricMetadataNotify {
  "email": string[];
  "hipchat": MetricMetadataHipchatNotification[];
  "pagerduty": MetricMetadataPagerDutyNotification[];
}
export interface MetricMetadataPagerDutyNotification {
  "apikey": string;
}
export type MetricPriority = "high" | "low" | "medium";
export type MetricType = "count" | "duration" | "percentage" | "rate" | "unknown";
export interface MissionAlertDTO {
  "type": string;
  "message": string;
  "alertTime": number;
}
export interface MissionDisplay {
  "attributes": string[];
  "locations": string[];
}
export interface MissionMetadata {
  "tutorial": TutorialMetadata;
  "npeRewardPack": NpeRewardPackMetadata;
  "missionType": string;
  "weekNum": number;
  "xpReward": number;
  "chain": number;
  "order": number;
  "chainSize": number;
  "minRequired"?: number;
  "objectiveMetadataMap"?: Record<string, ObjectiveMetaData>;
}
export interface MissionProgressDTO {
  "lastViewedProgress": number;
  "currentProgress": number;
  "totalCount": number;
}
export interface MissionRequirementDTO {
  "expression": string;
}
export interface MissionsCompressedPayloadDTO {
  "missionsCompressed": string;
}
export interface MucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface MultipleReplayMetadataRequestV2 {
  "platformId": string;
  "gameIds": number[];
}
export interface MultipleReplayMetadataResponseItemV2 {
  "gameId": number;
  "status": ReplayResponseStatus;
  "metadata": ReplayMetadataV2;
}
export interface MultipleReplayMetadataResponseV2 {
  "metadataResponses": MultipleReplayMetadataResponseItemV2[];
}
export interface NonTimingEventV1 {
  "when": number;
  "eventName": string;
  "value": string;
  "unit": string;
}
export interface NotifyFailureRequest {
  "availabilityItemName": string;
  "failureInfo": string;
}
export interface NotifySuccessRequest {
  "availabilityItemName": string;
}
export interface NpeReward {
  "renderer": string;
  "data": unknown;
}
export interface NpeRewardPackMetadata {
  "index": number;
  "premiumReward": boolean;
  "rewardKey": string;
  "majorReward": NpeReward;
  "minorRewards": NpeReward[];
}
export interface ObjectiveMetaData {
  "type": string;
  "id": number;
}
export interface OpenedTeamDTO {
  "name": string;
  "shortName": string;
  "logo": number;
  "logoColor": number;
  "invitationId": string;
  "captainId": number;
  "tier": number;
  "members": OpenedTeamMemberDTO[];
  "invitees": PendingRosterInviteeDTO[];
  "openPositions": Position[];
}
export interface OpenedTeamMemberDTO {
  "playerId": number;
  "position": Position;
  "tier": number;
  "friendship": number;
}
export interface PartiesVoiceDTO {
  "jwt": string;
}
export interface PatcherChunkingPatcherEnvironment {
  "game_patcher_available": boolean;
  "game_patcher_enabled": boolean;
}
export interface PatcherComponentActionProgress {
  "currentItem": string;
  "total": PatcherComponentStateProgress;
  "network": PatcherComponentStateProgress;
  "primaryWork": PatcherComponentStateWorkType;
}
export interface PatcherComponentState {
  "id": string;
  "action": PatcherComponentStateAction;
  "isUpToDate": boolean;
  "isUpdateAvailable": boolean;
  "timeOfLastUpToDateCheckISO8601"?: string;
  "isCorrupted": boolean;
  "progress"?: PatcherComponentActionProgress;
}
export type PatcherComponentStateAction = "CheckingForUpdates" | "Idle" | "Migrating" | "Patching" | "Repairing";
export interface PatcherComponentStateProgress {
  "bytesComplete": number;
  "bytesRequired": number;
  "bytesPerSecond": number;
}
export type PatcherComponentStateWorkType = "Disk" | "Network" | "Scanning";
export interface PatcherNotification {
  "id": string;
  "notificationId": PatcherNotificationId;
  "data": Record<string, unknown>;
}
export type PatcherNotificationId = "BrokenPermissions" | "ConnectionError" | "DidRestoreClientBackup" | "FailedToWriteError" | "MissingFilesError" | "NotEnoughDiskSpace" | "UnspecifiedError";
export interface PatcherP2PStatus {
  "isEnabledForPatchline": boolean;
  "isAllowedByUser": boolean;
  "requiresRestart": boolean;
}
export interface PatcherP2PStatusUpdate {
  "isAllowedByUser": boolean;
}
export interface PatcherProductResource {
  "id": string;
}
export interface PatcherProductState {
  "id": string;
  "action": PatcherComponentStateAction;
  "isUpToDate": boolean;
  "isUpdateAvailable": boolean;
  "isCorrupted": boolean;
  "isStopped": boolean;
  "percentPatched": number;
  "components": PatcherComponentState[];
}
export interface PatcherStatus {
  "connectedToPatchServer": boolean;
  "successfullyInstalledVersion"?: number;
}
export interface PatcherUxResource {
  "visible": boolean;
}
export interface PaymentsCurrencyDTO {
  "amount": number;
  "subCurrencies": Record<string, number>;
}
export interface PaymentsFrontEndRequest {
  "isPrepaid": boolean;
  "localeId": string;
  "summonerLevel": number;
  "gifteeAccountId": string;
  "gifteeMessage": string;
  "usePmcSessions": boolean;
  "game": string;
  "openedFrom": string;
  "minVirtualAmount": number;
  "orderDetailsJSON": string;
  "pricePointId": string;
}
export interface PaymentsFrontEndResult {
  "url": string;
}
export interface PaymentsPMCStartUrlRequest {
  "isPrepaid": boolean;
  "localeId": string;
  "summonerLevel": number;
  "gifteeAccountId": string;
  "gifteeMessage": string;
  "game": string;
  "openedFrom": string;
  "minVirtualAmount": number;
  "orderDetailsJSON": string;
  "machineId": string;
  "pricePointId": string;
}
export interface PaymentsPMCStartUrlResult {
  "id": string;
  "localeId": string;
  "userId": string;
  "summonerLevel": number;
  "playerFacingId": string;
  "pmcStartUrl": string;
  "createdAt": string;
}
export type PaymentsPaymentsTelemetryState = "Idle" | "PMCClosed" | "PMCComplete" | "PMCOpen";
export type PaymentsPaymentsTelemetryTransitions = "IdleToPMCOpen" | "PMCClosedToIdle" | "PMCCompleteToIdle" | "PMCOpenToPMCClose" | "PMCOpenToPMCComplete";
export interface PaymentsRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface PaymentsSkuPricePoint {
  "id": string;
  "realAmountCents": number;
  "realCurrencyCode": string;
  "riotSku": string;
}
export interface PendingOpenedTeamDTO {
  "invitationId": string;
  "name": string;
  "shortName": string;
  "logo": number;
  "logoColor": number;
  "tier": number;
}
export interface PendingRosterDTO {
  "version": number;
  "tournamentId": number;
  "invitationId": string;
  "name": string;
  "shortName": string;
  "logo": number;
  "logoColor": number;
  "rewardLogos": RewardLogo[];
  "tier": number;
  "captainId": number;
  "highTierVariance": boolean;
  "members": PendingRosterMemberDTO[];
  "invitees": PendingRosterInviteeDTO[];
  "ticketOffers": TicketOfferDTO[];
  "inviteFaileds": FailedInvite[];
  "lft": boolean;
  "mucJwtDto": MucJwtDto;
}
export interface PendingRosterInviteeDTO {
  "inviteeId": number;
  "inviteeState": PendingRosterInviteeState;
  "inviter": number;
  "inviteTime": number;
  "inviteType": InviteType;
}
export type PendingRosterInviteeState = "ACCEPTED" | "DECLINED" | "PENDING" | "REVOKED" | "SELFJOIN" | "SELFJOIN_DECLINED" | "SELFJOIN_REVOKED" | "SUGGESTED" | "SUGGEST_DECLINED" | "SUGGEST_REVOKED";
export interface PendingRosterMemberDTO {
  "playerId": number;
  "memberState": PendingRosterMemberState;
  "bet": number;
  "betType": TicketType;
  "position": Position;
  "joinTime": number;
  "pendingPay": number;
  "pendingPremiumPay": number;
  "selfBet": number;
  "tier": number;
}
export type PendingRosterMemberState = "FORCED_NOT_READY" | "KICK" | "LEFT" | "NOT_READY" | "READY";
export interface PhaseInMember {
  "playerId": number;
  "bet": number;
  "pendingPay": number;
  "selfBet": number;
}
export interface PhaseRosterDTO {
  "phaseId": number;
  "period": number;
  "bracketId": number;
  "checkinTime": number;
  "bracketDTO"?: Bracket;
}
export type PickModes = "DONE" | "IN_PROGRESS" | "NOT_PICKING";
export interface PlayerDTO {
  "banned": boolean;
  "tmntWins": number;
  "tmntLosses": number;
  "notifications": ClashOfflineNotification[];
  "lft": boolean;
  "primaryPos": string;
  "secondaryPos": string;
}
export interface PlayerFinderDTO {
  "playerId": number;
  "tier": number;
  "primaryPos": Position;
  "secondaryPos": Position;
  "type": PlayerFinderEnum;
  "friendId": number;
}
export type PlayerFinderEnum = "FREEAGENT" | "FRIEND";
export interface PlayerInfoDTO {
  "playerId": number;
  "teamId": string;
  "position": string;
  "role": Role;
}
export interface PlayerInventory {
  "wardSkins": number[];
  "champions": number[];
  "skins": number[];
  "icons": number[];
  "inventoryJwts": string[];
}
export interface PlayerLootDTO {
  "lootName": string;
  "refId": string;
  "count": number;
  "expiryTime": number;
}
export interface PlayerLootDefinitionsDTO {
  "lootItemList": LootItemListClientDTO;
  "recipeList": LootLcdsRecipeListClientDTO;
  "queryResult": QueryResultDTO;
  "playerLoot": PlayerLootDTO[];
}
export interface PlayerLootResultDTO {
  "status": string;
  "details": string;
  "added": PlayerLootDTO[];
  "removed": PlayerLootDTO[];
  "redeemed": string[];
  "failed": string[];
}
export interface PlayerMissionDTO {
  "id": string;
  "title": string;
  "helperText": string;
  "description": string;
  "missionLineText": string;
  "backgroundImageUrl": string;
  "iconImageUrl": string;
  "seriesName": string;
  "locale": string;
  "sequence": number;
  "metadata": MissionMetadata;
  "startTime": number;
  "endTime": number;
  "lastUpdatedTimestamp": number;
  "objectives": PlayerMissionObjectiveDTO[];
  "rewards": PlayerMissionRewardDTO[];
  "expiringWarnings": MissionAlertDTO[];
  "requirements": string[];
  "rewardStrategy": RewardStrategy;
  "display": MissionDisplay;
  "completionExpression": string;
  "viewed": boolean;
  "isNew": boolean;
  "status": string;
  "missionType": string;
  "displayType": string;
  "earnedDate": number;
  "completedDate": number;
  "cooldownTimeMillis": number;
  "celebrationType": string;
  "clientNotifyLevel": string;
  "internalName": string;
  "media": Record<string, string>;
}
export interface PlayerMissionEligibilityData {
  "level": number;
  "loyaltyEnabled": boolean;
  "playerInventory": PlayerInventory;
  "userInfoToken"?: string;
}
export interface PlayerMissionObjectiveDTO {
  "type": string;
  "description": string;
  "progress": MissionProgressDTO;
  "sequence": number;
  "rewardGroups": string[];
  "hasObjectiveBasedReward": boolean;
  "status": string;
  "requirements": string[];
}
export interface PlayerMissionRewardDTO {
  "rewardType": string;
  "rewardGroup": string;
  "description": string;
  "iconUrl": string;
  "smallIconUrl": string;
  "itemId": string;
  "itemTypeId": string;
  "uniqueName": string;
  "rewardFulfilled": boolean;
  "rewardGroupSelected": boolean;
  "sequence": number;
  "quantity": number;
  "isObjectiveBasedReward": boolean;
  "media": Record<string, string>;
  "iconNeedsFrame": boolean;
}
export interface PlayerNotificationsPlayerNotificationConfigResource {
  "ExpirationCheckFrequency"?: number;
}
export interface PlayerNotificationsPlayerNotificationResource {
  "backgroundUrl": string;
  "created": string;
  "critical": boolean;
  "data": Record<string, string>;
  "detailKey": string;
  "expires": string;
  "iconUrl": string;
  "id": number;
  "source": string;
  "state": string;
  "titleKey": string;
  "type": string;
  "dismissible": boolean;
}
export interface PlayerNotificationsRiotMessagingServiceMessage {
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
}
export interface PlayerParticipant {
  "summonerId": number;
}
export interface PlayerRosterHistoryDTO {
  "rosters": RosterMemberDTO[];
}
export interface PlayerTierDTO {
  "playerId": number;
  "tier": number;
  "primaryPos": Position;
  "secondPos": Position;
}
export interface PluginDescriptionResource {
  "name": string;
  "riotMeta": PluginMetadataResource;
  "pluginDependencies": string[];
}
export interface PluginLcdsEvent {
  "clientId": string;
  "subtopic": string;
  "typeName": string;
  "body": unknown;
}
export interface PluginLcdsResponse {
  "typeName": string;
  "body": unknown;
}
export interface PluginManagerResource {
  "state": PluginManagerState;
}
export type PluginManagerState = "NotReady" | "PluginsInitialized";
export interface PluginMetadataResource {
  "type": string;
  "subtype": string;
  "app": string;
  "feature": string;
  "mock": string;
  "hasBundledAssets": boolean;
  "globalAssetBundles": string[];
  "perLocaleAssetBundles": Record<string, unknown>;
  "implements": string[];
  "threading": PluginThreadingModel;
}
export interface PluginRegionLocaleChangedEvent {
  "region": string;
  "locale": string;
}
export interface PluginResource {
  "fullName": string;
  "shortName": string;
  "supertype": string;
  "subtype": string;
  "app": string;
  "feature": string;
  "threadingModel": string;
  "assetBundleNames": string[];
  "mountedAssetBundles": Record<string, string>;
  "orderWadFileMounted": number;
  "dependencies": PluginResourceContract[];
  "implementedContracts": PluginResourceContract[];
}
export interface PluginResourceContract {
  "fullName": string;
}
export interface PluginResourceEvent {
  "uri": string;
  "eventType": PluginResourceEventType;
  "data": unknown;
}
export type PluginResourceEventType = "Create" | "Delete" | "Update";
export interface PluginServiceProxyResponse {
  "uuid": string;
  "serviceName": string;
  "methodName": string;
  "payload": string;
  "status": string;
  "error": string;
}
export type PluginThreadingModel = "concurrent" | "dedicated" | "parallel" | "sequential";
export type Position = "BOTTOM" | "FILL" | "JUNGLE" | "MIDDLE" | "TOP" | "UNSELECTED" | "UTILITY";
export interface ProcessControlProcess {
  "status": string;
}
export interface PublicRosterDTO {
  "id": number;
  "tournamentId": number;
  "name": string;
  "shortName": string;
  "logo": number;
  "logoColor": number;
  "memberIds": number[];
}
export interface QueryEvaluationRequestDTO {
  "query": string;
}
export interface QueryEvaluationResultDTO {
  "lootItemNames": string[];
}
export interface QueryResultDTO {
  "queryToLootNames": unknown;
  "lastUpdate": number;
}
export interface RankedScoutingDTO {
  "playerId": number;
  "puuid": string;
  "totalMasteryScore": number;
  "topMasteries": ChampionMasteryPublicDTO[];
  "topSeasonChampions": ChampionScoutingDTO[];
}
export interface RankedScoutingMemberDTO {
  "playerId": number;
  "championScoutingData": RankedScoutingTopChampionDTO[];
}
export interface RankedScoutingTopChampionDTO {
  "championId": number;
  "rank": number;
  "winCount": number;
  "gameCount": number;
  "kda": number;
}
export interface RedeemLootTransactionDTO {
  "clientId": string;
  "transactionId": string;
  "lootName": string;
}
export type RemotingHelpFormat = "Brief" | "Console" | "Epytext" | "Full";
export type RemotingPrivilege = "Admin" | "Local" | "None" | "User";
export type RemotingSerializedFormat = "JSON" | "MsgPack" | "YAML";
export interface ReplayMetadataV2 {
  "gameVersion": string;
  "fileSize": number;
}
export type ReplayResponseStatus = "BAD_REQUEST" | "EXPIRED" | "INTERNAL_SERVER_ERROR" | "NOT_FOUND" | "OK";
export interface RewardDetails {
  "tournamentId": number;
  "rosterId": number;
  "teamMemberIds": number[];
}
export interface RewardLogo {
  "logo": number;
  "memberOwnedCount": number;
}
export interface RewardStrategy {
  "groupStrategy": string;
  "selectMaxGroupCount": number;
  "selectMinGroupCount": number;
}
export interface RiotMessagingServiceAcknowledgeBody {
  "id": string;
}
export interface RiotMessagingServiceEntitlementsToken {
  "accessToken": string;
  "token": string;
  "subject": string;
  "issuer": string;
  "entitlements": string[];
}
export interface RiotMessagingServiceSession {
  "state": RiotMessagingServiceState;
  "token": string;
  "tokenType": RiotMessagingServiceTokenType;
}
export type RiotMessagingServiceState = "Connected" | "Connecting" | "Disconnected" | "Disconnecting";
export type RiotMessagingServiceTokenType = "Access" | "Identity" | "Unavailable";
export interface RmsMessage {
  "id": string;
  "resource": string;
  "service": string;
  "version": string;
  "timestamp": number;
  "payload": string;
  "ackRequired": boolean;
}
export type Role = "CAPTAIN" | "MEMBER" | "NONE";
export interface RosterAggregatedStatsDTO {
  "periodStats": RosterPeriodAggregatedStatsDTO[];
  "playerStats": Record<string, RosterPlayerAggregatedStatsDTO>;
}
export interface RosterDTO {
  "version": number;
  "id": number;
  "tournamentId": number;
  "invitationId": string;
  "name": string;
  "shortName": string;
  "logo": number;
  "logoColor": number;
  "tier": number;
  "points": number;
  "wins": number;
  "losses": number;
  "eliminated": boolean;
  "captainId": number;
  "members": RosterMemberDTO[];
  "phases": PhaseRosterDTO[];
  "dynamicState": RosterDynamicStateDTO;
  "banned": boolean;
  "mucJwtDto": MucJwtDto;
}
export interface RosterDynamicStateDTO {
  "version": number;
  "tournamentId": number;
  "rosterId": number;
  "phaseCheckinStates": number[];
  "members": PhaseInMember[];
  "ticketOffers": TicketOfferDTO[];
  "withdraw": RosterWithdraw;
}
export interface RosterMatchAggregatedStatsDTO {
  "round": number;
  "duration": number;
  "opponentShortName": string;
  "opponentLogo": number;
  "opponentLogoColor": number;
  "win": boolean;
  "loserBracket": boolean;
  "gameId": number;
  "kills": number;
  "opponentKills": number;
  "playerChampionIds": Record<string, number>;
}
export interface RosterMemberDTO {
  "rosterId": number;
  "playerId": number;
  "tournamentId": number;
  "currentBid": number;
  "bidType": TicketType;
  "pendingSpend": number;
  "pendingPremiumSpend": number;
  "position": Position;
  "joinTime": number;
  "tier": number;
}
export interface RosterPeriodAggregatedStatsDTO {
  "period": number;
  "bracketSize": number;
  "time": number;
  "matchStats": RosterMatchAggregatedStatsDTO[];
  "playerBids": Record<string, number>;
}
export interface RosterPlayerAggregatedStatsDTO {
  "rawStatsSum": Record<string, number>;
  "rawStatsMax": Record<string, number>;
}
export interface RosterStatsDTO {
  "rosterId": number;
  "tournamentThemeId": number;
  "tournamentNameLocKey": string;
  "tournamentNameLocKeySecondary": string;
  "scheduleTime": number;
  "scheduleEndTime": number;
  "tournamentPeriods": number;
  "tier": number;
  "rosterName": string;
  "rosterShortName": string;
  "rosterLogo": number;
  "rosterLogoColor": number;
  "stats": RosterAggregatedStatsDTO;
}
export interface RosterWithdraw {
  "initVoteTime": number;
  "initVoteMember": number;
  "voteTimeoutMs": number;
  "lockoutTimeMs": number;
  "gameStartBufferMs": number;
  "voteWithdrawMembers": number[];
  "declineWithdrawMembers": number[];
}
export interface SLIBoolDiagnostic {
  "key": string;
  "value": boolean;
}
export interface SLICount {
  "sliName": string;
  "idempotencyKey": string;
  "successes": number;
  "failures": number;
  "startTimeEpochMs": number;
  "endTimeEpochMs": number;
  "labels": Record<string, string>;
  "boolDiagnostics": Record<string, boolean>;
  "doubleDiagnostics": Record<string, number>;
  "intDiagnostics": Record<string, number>;
  "stringDiagnostics": Record<string, string>;
}
export interface SLIDoubleDiagnostic {
  "key": string;
  "value": number;
}
export interface SLIIntDiagnostic {
  "key": string;
  "value": number;
}
export interface SLILabel {
  "key": string;
  "value": string;
}
export interface SLIStringDiagnostic {
  "key": string;
  "value": string;
}
export interface SanitizerContainsSanitizedRequest {
  "text": string;
  "level"?: number;
  "aggressiveScan"?: boolean;
}
export interface SanitizerContainsSanitizedResponse {
  "contains": boolean;
}
export interface SanitizerSanitizeRequest {
  "texts"?: string[];
  "text"?: string;
  "level"?: number;
  "aggressiveScan"?: boolean;
}
export interface SanitizerSanitizeResponse {
  "texts"?: string[];
  "text"?: string;
  "modified": boolean;
}
export interface SanitizerSanitizerStatus {
  "ready": boolean;
  "region": string;
  "locale": string;
  "filteredWordCountsByLevel": Record<string, number>;
  "whitelistedWordCountsByLevel": Record<string, number>;
  "breakingCharsCount": number;
  "projectedCharsCount": number;
}
export interface SeriesDTO {
  "id": string;
  "internalName": string;
  "parentInternalName": string;
  "type": string;
  "eligibilityType": string;
  "displayType": string;
  "title": string;
  "description": string;
  "optInButtonText": string;
  "optOutButtonText": string;
  "status": string;
  "startDate": number;
  "endDate": number;
  "createdDate": number;
  "lastUpdatedTimestamp": number;
  "viewed": boolean;
  "media": SeriesMediaDTO;
  "tags": string[];
  "warnings": AlertDTO[];
}
export interface SeriesMediaDTO {
  "backgroundUrl": string;
  "backgroundImageLargeUrl": string;
  "backgroundImageSmallUrl": string;
  "trackerIconUrl": string;
  "trackerIcon": string;
  "accentColor": string;
}
export interface ShutdownLcdsForcedClientShutdown {
  "reason": string;
  "additionalInfo": string;
}
export interface SimpleDialogMessage {
  "accountId": number;
  "msgId": string;
  "type": string;
  "params": string[];
}
export interface TeamBuilderDirect_Action {
  "actionId": number;
  "actorCellId": number;
  "type": string;
  "championId": number;
  "completed": boolean;
  "duration": number;
}
export interface TeamBuilderDirect_AfkCheckState {
  "maxAfkMillis": number;
  "remainingAfkMillis": number;
  "afkReady": boolean;
  "inventoryDraft": TeamBuilderDirect_InventoryDraft;
  "compressAfkCheckPayload": boolean;
  "multiUserChatJWT": string;
  "chatRoomName": string;
  "mucJwtDto": TeamBuilderDirect_MucJwtDto;
  "autoAccept": boolean;
}
export interface TeamBuilderDirect_AwSet {
  "entries": TeamBuilderDirect_AwSetEntry[];
}
export interface TeamBuilderDirect_AwSetEntry {
  "championId": string;
  "skinIds": number[];
}
export interface TeamBuilderDirect_BackwardsTransitionInfo {
  "backwardsTransitionReason": string;
  "initiatorSummonerIds": number[];
}
export interface TeamBuilderDirect_BenchChampion {
  "championId": number;
  "isPriority": boolean;
}
export interface TeamBuilderDirect_Cell {
  "teamId": number;
  "cellId": number;
  "championPickIntent": number;
  "championId": number;
  "skinId": number;
  "assignedPosition": string;
  "spell1Id": number;
  "spell2Id": number;
  "summonerId": number;
  "gameName": string;
  "tagLine": string;
  "puuid": string;
  "isHumanoid": boolean;
  "nameVisibilityType": string;
  "obfuscatedSummonerId": number;
  "obfuscatedPuuid": string;
  "isAutofilled": boolean;
}
export interface TeamBuilderDirect_Cells {
  "alliedTeam": TeamBuilderDirect_Cell[];
  "enemyTeam": TeamBuilderDirect_Cell[];
}
export interface TeamBuilderDirect_Ceremony {
  "name": string;
  "duration": number;
}
export interface TeamBuilderDirect_ChampGridChampion {
  "id": number;
  "relatedPrimeItemId": number;
  "name": string;
  "squarePortraitPath": string;
  "freeToPlay": boolean;
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "freeToPlayForQueue": boolean;
  "owned": boolean;
  "rented": boolean;
  "disabled": boolean;
  "roles": string[];
  "masteryPoints": number;
  "masteryLevel": number;
  "selectionStatus": TeamBuilderDirect_ChampionSelection;
  "positionsFavorited": string[];
}
export interface TeamBuilderDirect_ChampSelectAction {
  "id": number;
  "actorCellId": number;
  "championId": number;
  "type": string;
  "completed": boolean;
  "isAllyAction": boolean;
  "isInProgress": boolean;
  "pickTurn": number;
  "duration": number;
}
export interface TeamBuilderDirect_ChampSelectBannedChampions {
  "myTeamBans": number[];
  "theirTeamBans": number[];
  "numBans": number;
}
export interface TeamBuilderDirect_ChampSelectChampionSwapNotification {
  "id": number;
  "responderIndex": number;
  "state": TeamBuilderDirect_ChampSelectSwapState;
  "otherSummonerIndex": number;
  "responderChampionName": string;
  "responderChampionSquarePortrait": string;
  "requesterChampionName": string;
  "requesterChampionSplashPath": string;
  "requesterChampionSquarePortrait": string;
  "initiatedByLocalPlayer": boolean;
  "type": TeamBuilderDirect_ChampSelectSwapType;
  "requesterChampionId": number;
}
export interface TeamBuilderDirect_ChampSelectChatRoomDetails {
  "multiUserChatId": string;
  "multiUserChatPassword": string;
  "mucJwtDto": TeamBuilderDirect_MucJwtDto;
}
export interface TeamBuilderDirect_ChampSelectMySelection {
  "selectedSkinId"?: number;
  "spell1Id"?: number;
  "spell2Id"?: number;
}
export interface TeamBuilderDirect_ChampSelectPickOrderSwapNotification {
  "id": number;
  "requestorIndex": number;
  "responderIndex": number;
  "state": TeamBuilderDirect_ChampSelectSwapState;
  "otherSummonerIndex": number;
  "initiatedByLocalPlayer": boolean;
  "type": TeamBuilderDirect_ChampSelectSwapType;
}
export interface TeamBuilderDirect_ChampSelectPickSnipeData {
  "pickSnipeClass": string;
  "snipedPlayerCellId": number;
  "expirationTimeMillis": number;
  "creationTimeMillis": number;
  "snipedChampionId": number;
}
export interface TeamBuilderDirect_ChampSelectPinDropNotification {
  "pinDropSummoners": TeamBuilderDirect_ChampSelectPinDropSummoner[];
  "mapSide": string;
}
export interface TeamBuilderDirect_ChampSelectPinDropSummoner {
  "slotId": number;
  "position": string;
  "lane": string;
  "lanePosition": number;
  "isLocalSummoner": boolean;
  "isPlaceholder": boolean;
  "isAutofilled": boolean;
}
export interface TeamBuilderDirect_ChampSelectPlayerSelection {
  "cellId": number;
  "championId": number;
  "selectedSkinId": number;
  "wardSkinId": number;
  "spell1Id": number;
  "spell2Id": number;
  "team": number;
  "assignedPosition": string;
  "championPickIntent": number;
  "playerType": string;
  "summonerId": number;
  "gameName": string;
  "tagLine": string;
  "puuid": string;
  "isHumanoid": boolean;
  "nameVisibilityType": string;
  "playerAlias": string;
  "obfuscatedSummonerId": number;
  "obfuscatedPuuid": string;
  "isAutofilled": boolean;
  "internalName": string;
  "pickMode": number;
  "pickTurn": number;
}
export interface TeamBuilderDirect_ChampSelectPositionSwapNotification {
  "id": number;
  "requestorIndex": number;
  "responderIndex": number;
  "requesterPosition": string;
  "responderPosition": string;
  "state": TeamBuilderDirect_ChampSelectSwapState;
  "otherSummonerIndex": number;
  "initiatedByLocalPlayer": boolean;
  "type": TeamBuilderDirect_ChampSelectSwapType;
}
export interface TeamBuilderDirect_ChampSelectSession {
  "id": string;
  "gameId": number;
  "queueId": number;
  "timer": TeamBuilderDirect_TeambuilderDirectTypes_ChampSelectTimer;
  "chatDetails": TeamBuilderDirect_ChampSelectChatRoomDetails;
  "myTeam": TeamBuilderDirect_ChampSelectPlayerSelection[];
  "theirTeam": TeamBuilderDirect_ChampSelectPlayerSelection[];
  "trades": TeamBuilderDirect_ChampSelectSwapContract[];
  "pickOrderSwaps": TeamBuilderDirect_ChampSelectSwapContract[];
  "positionSwaps": TeamBuilderDirect_ChampSelectSwapContract[];
  "actions": unknown[];
  "bans": TeamBuilderDirect_ChampSelectBannedChampions;
  "localPlayerCellId": number;
  "isSpectating": boolean;
  "allowSkinSelection": boolean;
  "allowSubsetChampionPicks": boolean;
  "allowDuplicatePicks": boolean;
  "allowPlayerPickSameChampion": boolean;
  "disallowBanningTeammateHoveredChampions": boolean;
  "allowBattleBoost": boolean;
  "boostableSkinCount": number;
  "allowRerolling": boolean;
  "rerollsRemaining": number;
  "allowLockedEvents": boolean;
  "lockedEventIndex": number;
  "benchEnabled": boolean;
  "benchChampions": TeamBuilderDirect_BenchChampion[];
  "counter": number;
  "skipChampionSelect": boolean;
  "hasSimultaneousBans": boolean;
  "hasSimultaneousPicks": boolean;
  "showQuitButton": boolean;
  "isLegacyChampSelect": boolean;
  "isCustomGame": boolean;
}
export interface TeamBuilderDirect_ChampSelectSummoner {
  "cellId": number;
  "slotId": number;
  "spell1IconPath": string;
  "spell2IconPath": string;
  "assignedPosition": string;
  "summonerId": number;
  "gameName": string;
  "tagLine": string;
  "puuid": string;
  "isHumanoid": boolean;
  "nameVisibilityType": string;
  "obfuscatedSummonerId": number;
  "obfuscatedPuuid": string;
  "activeActionType": string;
  "championIconStyle": string;
  "skinSplashPath": string;
  "actingBackgroundAnimationState": string;
  "statusMessageKey": string;
  "championId": number;
  "championName": string;
  "pickSnipedClass": string;
  "currentChampionVotePercentInteger": number;
  "skinId": number;
  "banIntentChampionId": number;
  "isOnPlayersTeam": boolean;
  "shouldShowSelectedSkin": boolean;
  "shouldShowExpanded": boolean;
  "isActingNow": boolean;
  "shouldShowActingBar": boolean;
  "isSelf": boolean;
  "shouldShowBanIntentIcon": boolean;
  "isPickIntenting": boolean;
  "isDonePicking": boolean;
  "isPlaceholder": boolean;
  "shouldShowSpells": boolean;
  "shouldShowRingAnimations": boolean;
  "areSummonerActionsComplete": boolean;
  "tradeId": number;
  "swapId": number;
  "positionSwapId": number;
  "showTrades": boolean;
  "showSwaps": boolean;
  "showPositionSwaps": boolean;
  "showMuted": boolean;
  "isAutofilled": boolean;
}
export interface TeamBuilderDirect_ChampSelectSwapContract {
  "id": number;
  "cellId": number;
  "state": TeamBuilderDirect_ChampSelectSwapState;
}
export type TeamBuilderDirect_ChampSelectSwapState = "ACCEPTED" | "AVAILABLE" | "BUSY" | "CANCELLED" | "DECLINED" | "INVALID" | "RECEIVED" | "SENT";
export type TeamBuilderDirect_ChampSelectSwapType = "CHAMPION" | "PICK_ORDER" | "POSITION";
export interface TeamBuilderDirect_ChampionBenchState {
  "benchEnabled": boolean;
  "championIds": number[];
  "benchChampions": TeamBuilderDirect_BenchChampion[];
}
export interface TeamBuilderDirect_ChampionMastery {
  "championId": number;
  "championLevel": number;
  "championPoints": number;
}
export interface TeamBuilderDirect_ChampionQuestSkinInfo {
  "splashPath": string;
  "tilePath": string;
  "tiers": TeamBuilderDirect_CollectionsChampionQuestSkin[];
  "productType"?: TeamBuilderDirect_QuestSkinProductType;
}
export interface TeamBuilderDirect_ChampionSelectPreferences {
  "skins": Record<string, number>;
  "spells": Record<string, unknown>;
}
export interface TeamBuilderDirect_ChampionSelectState {
  "teamId": string;
  "teamChatRoomId": string;
  "subphase": string;
  "actionSetList": unknown[];
  "ceremoniesByActionSetIndex": Record<string, unknown>;
  "cells": TeamBuilderDirect_Cells;
  "currentActionSetIndex": number;
  "localPlayerCellId": number;
  "currentTotalTimeMillis": number;
  "currentTimeRemainingMillis": number;
  "trades": TeamBuilderDirect_Swap[];
  "pickOrderSwaps": TeamBuilderDirect_Swap[];
  "positionSwaps": TeamBuilderDirect_Swap[];
  "pickIntentClearedReason": string;
  "allowOptingOutOfBanning": boolean;
  "allowSkinSelection": boolean;
  "allowDuplicatePicks": boolean;
  "allowPlayerPickSameChampion": boolean;
  "disallowBanningTeammateHoveredChampions": boolean;
  "allowSubsetChampionPicks": boolean;
  "rerollState": TeamBuilderDirect_RerollState;
  "lockedEventsState": TeamBuilderDirect_LockedEventsState;
  "battleBoostState": TeamBuilderDirect_TeamBuilderBoostInfo;
  "championBenchState": TeamBuilderDirect_ChampionBenchState;
  "inventoryDraft": TeamBuilderDirect_InventoryDraft;
  "skipChampionSelect": boolean;
  "isSpectating": boolean;
  "showQuitButton": boolean;
}
export interface TeamBuilderDirect_ChampionSelection {
  "selectedByMe": boolean;
  "banIntentedByMe": boolean;
  "banIntented": boolean;
  "isBanned": boolean;
  "pickIntented": boolean;
  "pickIntentedByMe": boolean;
  "pickIntentedPosition": string;
  "pickedByOtherOrBanned": boolean;
}
export interface TeamBuilderDirect_ChampionSkinAugment {
  "contentId": string;
  "overlays": TeamBuilderDirect_ChampionSkinAugmentOverlays[];
}
export interface TeamBuilderDirect_ChampionSkinAugmentOverlays {
  "centeredLCOverlayPath": string;
  "socialCardLCOverlayPath": string;
  "tileLCOverlayPath": string;
  "uncenteredLCOverlayPath": string;
}
export interface TeamBuilderDirect_ChampionSkinAugments {
  "augments": TeamBuilderDirect_ChampionSkinAugment[];
}
export interface TeamBuilderDirect_CollectionsChampion {
  "disabledQueues": string[];
  "freeToPlay": boolean;
  "id": number;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "active": boolean;
}
export interface TeamBuilderDirect_CollectionsChampionBaseSkin {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "skinAugments": TeamBuilderDirect_ChampionSkinAugments;
}
export interface TeamBuilderDirect_CollectionsChampionChroma {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "skinAugments": TeamBuilderDirect_ChampionSkinAugments;
  "colors": string[];
}
export interface TeamBuilderDirect_CollectionsChampionMinimal {
  "banVoPath": string;
  "chooseVoPath": string;
  "disabledQueues": string[];
  "id": number;
  "name": string;
  "relatedPrimeItemId": number;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "roles": string[];
  "squarePortraitPath": string;
  "stingerSfxPath": string;
  "baseSplashPath": string;
  "freeToPlay": boolean;
}
export interface TeamBuilderDirect_CollectionsChampionQuestSkin {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "skinAugments": TeamBuilderDirect_ChampionSkinAugments;
  "splashPath": string;
  "tilePath": string;
  "stage": number;
  "shortName": string;
  "splashVideoPath": string;
}
export interface TeamBuilderDirect_CollectionsChampionSkin {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "skinAugments": TeamBuilderDirect_ChampionSkinAugments;
  "splashPath": string;
  "tilePath": string;
  "chromas": TeamBuilderDirect_CollectionsChampionChroma[];
  "questSkinInfo": TeamBuilderDirect_ChampionQuestSkinInfo;
  "emblems": TeamBuilderDirect_CollectionsChampionSkinEmblem[];
  "rarityGemPath": string;
  "splashVideoPath"?: string;
  "skinType"?: string;
}
export interface TeamBuilderDirect_CollectionsChampionSkinEmblem {
  "name": string;
  "emblemPath": TeamBuilderDirect_CollectionsChampionSkinEmblemPath;
  "positions": TeamBuilderDirect_CollectionsChampionSkinEmblemPosition;
}
export interface TeamBuilderDirect_CollectionsChampionSkinEmblemPath {
  "large": string;
  "small": string;
}
export interface TeamBuilderDirect_CollectionsChampionSkinEmblemPosition {
  "vertical": string;
  "horizontal": string;
}
export interface TeamBuilderDirect_CollectionsChampionSkinMinimal {
  "championId": number;
  "chromaPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "skinAugments": TeamBuilderDirect_ChampionSkinAugments;
  "splashPath": string;
  "tilePath": string;
}
export interface TeamBuilderDirect_CollectionsOwnership {
  "loyaltyReward": boolean;
  "xboxGPReward": boolean;
  "owned": boolean;
  "rental": TeamBuilderDirect_CollectionsRental;
}
export interface TeamBuilderDirect_CollectionsRental {
  "rented": boolean;
}
export interface TeamBuilderDirect_GameDataSummonerSpell {
  "id": number;
  "iconPath": string;
}
export interface TeamBuilderDirect_GameModeSpellList {
  "spells": number[];
}
export interface TeamBuilderDirect_GameflowGameClient {
  "running": boolean;
  "visible": boolean;
}
export interface TeamBuilderDirect_GameflowGameData {
  "queue": TeamBuilderDirect_Queue;
}
export interface TeamBuilderDirect_GameflowGameDodge {
  "state": TeamBuilderDirect_GameflowGameDodgeState;
  "dodgeIds": number[];
}
export type TeamBuilderDirect_GameflowGameDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
export interface TeamBuilderDirect_GameflowGameMap {
  "perPositionRequiredSummonerSpells": Record<string, TeamBuilderDirect_GameModeSpellList>;
  "perPositionDisallowedSummonerSpells": Record<string, TeamBuilderDirect_GameModeSpellList>;
}
export type TeamBuilderDirect_GameflowPhase = "ChampSelect" | "CheckedIntoTournament" | "EndOfGame" | "FailedToLaunch" | "GameStart" | "InProgress" | "Lobby" | "Matchmaking" | "None" | "PreEndOfGame" | "ReadyCheck" | "Reconnect" | "TerminatedInError" | "WaitingForStats";
export interface TeamBuilderDirect_GameflowQueue {
  "id": number;
}
export type TeamBuilderDirect_GameflowServiceErrorType = "PLAYER_LACKS_VANGUARD_SESSION";
export interface TeamBuilderDirect_GameflowSession {
  "phase": TeamBuilderDirect_GameflowPhase;
  "gameClient": TeamBuilderDirect_GameflowGameClient;
  "gameData": TeamBuilderDirect_GameflowGameData;
}
export interface TeamBuilderDirect_GatekeeperRestricted {
  "gatekeeperRestrictions": TeamBuilderDirect_GatekeeperRestriction[];
}
export interface TeamBuilderDirect_GatekeeperRestriction {
  "summonerId": number;
  "reason": string;
  "remainingMillis": number;
  "payload": string;
  "queueId": number;
}
export interface TeamBuilderDirect_InventoryDraft {
  "lastSelectedSkinIdByChampionId": Record<string, number>;
  "skinIds": number[];
  "spellIds": number[];
  "initialSpellIds": number[];
  "allChampionIds": number[];
  "disabledChampionIds": number[];
  "crowdFavoriteChampionIds": number[];
  "subsetChampionIds": number[];
}
export interface TeamBuilderDirect_InventoryItem {
  "itemId": number;
  "inventoryType": string;
}
export interface TeamBuilderDirect_InventoryItemDTO {
  "itemId": number;
  "inventoryType": string;
  "payload": unknown;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "lsb": boolean;
}
export interface TeamBuilderDirect_InventoryItemWithPayload {
  "itemId": number;
  "inventoryType": string;
  "f2p": boolean;
  "rental": boolean;
  "loyalty": boolean;
  "owned": boolean;
  "payload": unknown;
}
export interface TeamBuilderDirect_LobbyStatus {
  "queueId": number;
  "isCustom": boolean;
  "isLeader": boolean;
  "isSpectator": boolean;
  "allowedPlayAgain": boolean;
  "memberSummonerIds": number[];
}
export interface TeamBuilderDirect_LockedEventsState {
  "allowLockedEvents": boolean;
  "lockedEventIndex": number;
}
export interface TeamBuilderDirect_LoginSession {
  "state": TeamBuilderDirect_LoginSessionState;
  "puuid": string;
  "summonerId"?: number;
}
export type TeamBuilderDirect_LoginSessionState = "ERROR" | "IN_PROGRESS" | "LOGGING_OUT" | "SUCCEEDED";
export interface TeamBuilderDirect_MatchmakingDodgeData {
  "state": TeamBuilderDirect_MatchmakingDodgeState;
  "dodgerId": number;
}
export type TeamBuilderDirect_MatchmakingDodgeState = "Invalid" | "PartyDodged" | "StrangerDodged" | "TournamentDodged";
export type TeamBuilderDirect_MatchmakingDodgeWarning = "None" | "Penalty" | "Warning";
export interface TeamBuilderDirect_MatchmakingLowPriorityData {
  "penalizedSummonerIds": number[];
  "penaltyTime": number;
  "penaltyTimeRemaining": number;
  "bustedLeaverAccessToken": string;
}
export interface TeamBuilderDirect_MatchmakingReadyCheckResource {
  "state": TeamBuilderDirect_MatchmakingReadyCheckState;
  "playerResponse": TeamBuilderDirect_MatchmakingReadyCheckResponse;
  "dodgeWarning": TeamBuilderDirect_MatchmakingDodgeWarning;
  "timer": number;
  "declinerIds": number[];
  "autoAccept": boolean;
}
export type TeamBuilderDirect_MatchmakingReadyCheckResponse = "Accepted" | "Declined" | "None";
export type TeamBuilderDirect_MatchmakingReadyCheckState = "Error" | "EveryoneReady" | "InProgress" | "Invalid" | "PartyNotReady" | "StrangerNotReady";
export interface TeamBuilderDirect_MatchmakingSearchErrorResource {
  "id": number;
  "errorType": string;
  "penalizedSummonerId": number;
  "penaltyTimeRemaining": number;
  "message": string;
}
export interface TeamBuilderDirect_MatchmakingSearchResource {
  "queueId": number;
  "isCurrentlyInQueue": boolean;
  "lobbyId": string;
  "searchState": TeamBuilderDirect_MatchmakingSearchState;
  "timeInQueue": number;
  "estimatedQueueTime": number;
  "readyCheck": TeamBuilderDirect_MatchmakingReadyCheckResource;
  "dodgeData": TeamBuilderDirect_MatchmakingDodgeData;
  "lowPriorityData": TeamBuilderDirect_MatchmakingLowPriorityData;
  "errors": TeamBuilderDirect_MatchmakingSearchErrorResource[];
}
export type TeamBuilderDirect_MatchmakingSearchState = "AbandonedLowPriorityQueue" | "Canceled" | "Error" | "Found" | "Invalid" | "Searching" | "ServiceError" | "ServiceShutdown";
export interface TeamBuilderDirect_MatchmakingState {
  "estimatedMatchmakingTimeMillis": number;
  "timeInMatchmakingMillis": number;
  "backwardsTransitionReason": string;
}
export interface TeamBuilderDirect_MucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface TeamBuilderDirect_MutedPlayerInfo {
  "puuid": string;
  "summonerId": number;
  "obfuscatedPuuid": string;
  "obfuscatedSummonerId": number;
}
export interface TeamBuilderDirect_PlayerStatus {
  "currentLobbyStatus"?: TeamBuilderDirect_LobbyStatus;
  "lastQueuedLobbyStatus"?: TeamBuilderDirect_LobbyStatus;
}
export type TeamBuilderDirect_QuestSkinProductType = "kQuestSkin" | "kTieredSkin";
export interface TeamBuilderDirect_Queue {
  "id": number;
  "mapId": number;
  "name": string;
  "shortName": string;
  "description": string;
  "detailedDescription": string;
  "type": string;
  "gameMode": string;
  "assetMutator": string;
  "category": TeamBuilderDirect_QueueGameCategory;
  "gameTypeConfig": TeamBuilderDirect_QueueGameTypeConfig;
  "numPlayersPerTeam": number;
  "minimumParticipantListSize": number;
  "maximumParticipantListSize": number;
  "minLevel": number;
  "isRanked": boolean;
  "areFreeChampionsAllowed": boolean;
  "isTeamBuilderManaged": boolean;
  "queueAvailability": TeamBuilderDirect_QueueAvailability;
  "queueRewards": TeamBuilderDirect_QueueReward;
  "spectatorEnabled": boolean;
  "championsRequiredToPlay": number;
  "allowablePremadeSizes": number[];
  "showPositionSelector": boolean;
  "showQuickPlaySlotSelection": boolean;
  "lastToggledOffTime": number;
  "lastToggledOnTime": number;
  "removalFromGameAllowed": boolean;
  "removalFromGameDelayMinutes": number;
  "isCustom": boolean;
  "isBotHonoringAllowed": boolean;
}
export type TeamBuilderDirect_QueueAvailability = "Available" | "DoesntMeetRequirements" | "PlatformDisabled";
export type TeamBuilderDirect_QueueGameCategory = "Alpha" | "Custom" | "None" | "PvP" | "VersusAi";
export interface TeamBuilderDirect_QueueGameTypeConfig {
  "id": number;
  "name": string;
  "maxAllowableBans": number;
  "allowTrades": boolean;
  "allowPickOrderSwaps": boolean;
  "exclusivePick": boolean;
  "duplicatePick": boolean;
  "teamChampionPool": boolean;
  "crossTeamChampionPool": boolean;
  "advancedLearningQuests": boolean;
  "battleBoost": boolean;
  "deathMatch": boolean;
  "doNotRemove": boolean;
  "learningQuests": boolean;
  "onboardCoopBeginner": boolean;
  "reroll": boolean;
  "mainPickTimerDuration": number;
  "postPickTimerDuration": number;
  "banTimerDuration": number;
  "pickMode": string;
  "banMode": string;
}
export interface TeamBuilderDirect_QueueReward {
  "isIpEnabled": boolean;
  "isXpEnabled": boolean;
  "isChampionPointsEnabled": boolean;
  "partySizeIpRewards": number[];
}
export interface TeamBuilderDirect_RerollState {
  "allowRerolling": boolean;
  "rerollsRemaining": number;
}
export interface TeamBuilderDirect_SettingCategoryResource {
  "schemaVersion": number;
  "data": TeamBuilderDirect_ChampionSelectPreferences;
}
export interface TeamBuilderDirect_SettingsResource {
  "data": unknown;
  "schemaVersion": number;
}
export interface TeamBuilderDirect_SfxNotification {
  "delayMillis": number;
  "path": string;
  "eventType": string;
}
export interface TeamBuilderDirect_SkinSelectorBaseSkin {
  "championId": number;
  "chromaPreviewPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "isChampionUnlocked": boolean;
  "splashPath": string;
  "splashVideoPath"?: string;
  "tilePath": string;
  "unlocked": boolean;
  "awUnlocked": boolean;
  "skinAugments": Record<string, TeamBuilderDirect_ChampionSkinAugmentOverlays>;
}
export interface TeamBuilderDirect_SkinSelectorChildSkin {
  "championId": number;
  "chromaPreviewPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "isChampionUnlocked": boolean;
  "splashPath": string;
  "splashVideoPath"?: string;
  "tilePath": string;
  "unlocked": boolean;
  "awUnlocked": boolean;
  "skinAugments": Record<string, TeamBuilderDirect_ChampionSkinAugmentOverlays>;
  "parentSkinId": number;
  "colors": string[];
  "stage": number;
  "shortName": string;
}
export interface TeamBuilderDirect_SkinSelectorInfo {
  "selectedSkinId": number;
  "isSkinGrantedFromBoost": boolean;
  "selectedChampionId": number;
  "championName": string;
  "skinSelectionDisabled": boolean;
  "showSkinSelector": boolean;
}
export interface TeamBuilderDirect_SkinSelectorSkin {
  "championId": number;
  "chromaPreviewPath"?: string;
  "id": number;
  "name": string;
  "ownership": TeamBuilderDirect_CollectionsOwnership;
  "isBase": boolean;
  "disabled": boolean;
  "stillObtainable": boolean;
  "isChampionUnlocked": boolean;
  "splashPath": string;
  "splashVideoPath"?: string;
  "tilePath": string;
  "unlocked": boolean;
  "awUnlocked": boolean;
  "skinAugments": Record<string, TeamBuilderDirect_ChampionSkinAugmentOverlays>;
  "childSkins": TeamBuilderDirect_SkinSelectorChildSkin[];
  "emblems": TeamBuilderDirect_CollectionsChampionSkinEmblem[];
  "rarityGemPath": string;
  "groupSplash": string;
  "productType"?: TeamBuilderDirect_QuestSkinProductType;
}
export interface TeamBuilderDirect_Summoner {
  "summonerId": number;
  "summonerLevel": number;
}
export interface TeamBuilderDirect_Swap {
  "id": number;
  "cellId": number;
  "state": string;
}
export interface TeamBuilderDirect_TbRemovedFromServiceNotification {
  "reason": string;
  "backwardsTransitionInfo": TeamBuilderDirect_BackwardsTransitionInfo;
}
export interface TeamBuilderDirect_TbdGameDto {
  "counter": number;
  "phaseName": string;
  "queueId": number;
  "gameId": number;
  "matchmakingState"?: TeamBuilderDirect_MatchmakingState;
  "afkCheckState"?: TeamBuilderDirect_AfkCheckState;
  "championSelectState"?: TeamBuilderDirect_ChampionSelectState;
  "requestGuid": string;
  "awSet": TeamBuilderDirect_AwSetEntry[];
}
export interface TeamBuilderDirect_TeamBoost {
  "activatorCellId": number;
  "skinUnlockMode": string;
  "price": number;
  "ipReward": number;
  "ipRewardForPurchaser": number;
  "availableSkins": number[];
  "unlocked": boolean;
}
export interface TeamBuilderDirect_TeamBuilderBoostInfo {
  "allowBattleBoost": boolean;
  "boostableSkinCount": number;
  "activatorCellId": number;
  "battleBoostActivated": boolean;
  "cost": number;
  "unlockedSkinIds": number[];
}
export interface TeamBuilderDirect_TeambuilderDirectTypes_ChampSelectTimer {
  "adjustedTimeLeftInPhase": number;
  "totalTimeInPhase": number;
  "phase": string;
  "isInfinite": boolean;
  "internalNowInEpochMs": number;
}
export interface TeamBuilderDirect_TeambuilderLeagueEdgeResponse {
  "payload": TeamBuilderDirect_TbdGameDto;
  "status": string;
}
export interface TeambuilderEdge_AcceptPickOrderSwapV1 {
  "swapId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_AcceptPositionSwapV1 {
  "swapId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_AcceptTradeV1 {
  "tradeId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_ActionV1 {
  "actionId": number;
  "actorCellId": number;
  "type": string;
  "championId": number;
  "completed": boolean;
}
export interface TeambuilderEdge_AfkCheckStateV1 {
  "maxAfkMillis": number;
  "remainingAfkMillis": number;
  "afkReady": boolean;
  "inventoryDraft": TeambuilderEdge_InventoryDraftV1;
  "compressAfkCheckPayload": boolean;
  "multiUserChatJWT": string;
  "chatRoomName": string;
  "mucJwtDto": TeambuilderEdge_MucJwtDto;
  "autoAccept": boolean;
}
export interface TeambuilderEdge_AfkCheckStateV2 {
  "maxAfkMillis": number;
  "remainingAfkMillis": number;
  "afkReady": boolean;
}
export interface TeambuilderEdge_AutoFillDataBagForClientV1 {
  "queueId": number;
  "autoFillEligible": boolean;
  "autoFillProtectedForStreaking": boolean;
  "autoFillProtectedForPromos": boolean;
  "autoFillProtectedForRemedy": boolean;
  "overridePositionSelectionsWithFill": boolean;
}
export interface TeambuilderEdge_BattleBoostStateV1 {
  "allowBattleBoost": boolean;
  "boostableSkinCount": number;
  "battleBoostActivated": boolean;
  "activatorCellId": number;
  "unlockedSkinIds": number[];
  "cost": number;
}
export interface TeambuilderEdge_CellV1 {
  "teamId": number;
  "cellId": number;
  "puuid": string;
  "summonerName": string;
  "gameName": string;
  "tagLine": string;
  "isHumanoid": boolean;
  "isAutofilled": boolean;
  "summonerId": number;
  "championPickIntent": number;
  "championId": number;
  "assignedPosition": string;
  "spell1Id": number;
  "spell2Id": number;
  "skinId": number;
  "nameVisibilityType": string;
}
export interface TeambuilderEdge_CellsV1 {
  "alliedTeam": TeambuilderEdge_CellV1[];
  "enemyTeam": TeambuilderEdge_CellV1[];
}
export interface TeambuilderEdge_CeremonyDescriptorV1 {
  "duration": number;
  "name": string;
}
export interface TeambuilderEdge_ChampionBenchStateV1 {
  "benchEnabled": boolean;
  "championIds": number[];
}
export interface TeambuilderEdge_ChampionBenchSwapV1 {
  "championId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_ChampionSelectStateV1 {
  "teamId": string;
  "teamChatRoomId": string;
  "subphase": string;
  "actionSetList": unknown;
  "currentActionSetIndex": number;
  "ceremoniesByActionSetIndex": unknown;
  "cells": TeambuilderEdge_CellsV1;
  "localPlayerCellId": number;
  "currentTotalTimeMillis": number;
  "currentTimeRemainingMillis": number;
  "trades": TeambuilderEdge_TradeV1[];
  "pickOrderSwaps": TeambuilderEdge_PickOrderTradeV1[];
  "positionSwaps": TeambuilderEdge_PositionTradeV1[];
  "pickIntentClearedReason": string;
  "allowOptingOutOfBanning": boolean;
  "allowSkinSelection": boolean;
  "allowDuplicatePicks": boolean;
  "allowPlayerPickSameChampion": boolean;
  "disallowBanningTeammateHoveredChampions": boolean;
  "rerollState": TeambuilderEdge_RerollStateV1;
  "lockedEventsState": TeambuilderEdge_LockedEventsStateV1;
  "battleBoostState": TeambuilderEdge_BattleBoostStateV1;
  "championBenchState": TeambuilderEdge_ChampionBenchStateV1;
  "inventoryDraft": TeambuilderEdge_InventoryDraftV1;
  "skipChampionSelect": boolean;
  "isSpectating": boolean;
  "showQuitButton": boolean;
  "allowSubsetChampionPicks": boolean;
}
export interface TeambuilderEdge_DeclinePickOrderSwapV1 {
  "swapId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_DeclinePositionSwapV1 {
  "swapId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_DeclineTradeV1 {
  "tradeId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_GameloopPlayerInfoV2 {
  "autoFillDataBags": TeambuilderEdge_AutoFillDataBagForClientV1[];
  "rerollDataBags": TeambuilderEdge_RerollDataBagForClientV1[];
}
export interface TeambuilderEdge_IndicateAfkReadinessV2 {
  "afkReady": boolean;
  "initialSpellIds"?: number[];
  "lastSelectedSkinIdByChampionId"?: Record<string, number>;
  "simplifiedInventoryJwt"?: string;
  "requestGuid": string;
}
export interface TeambuilderEdge_InventoryDraftV1 {
  "lastSelectedSkinIdByChampionId": Record<string, number>;
  "skinIds": number[];
  "spellIds": number[];
  "initialSpellIds": number[];
  "allChampionIds": number[];
  "disabledChampionIds": number[];
  "crowdFavoriteChampionIds": number[];
  "subsetChampionIds": number[];
  "awSet"?: unknown;
}
export interface TeambuilderEdge_LeaveV1 {
  "removedFromServiceReason": string;
  "contextJson": string;
  "removeHard": boolean;
}
export interface TeambuilderEdge_LockedEventsStateV1 {
  "allowLockedEvents": boolean;
  "lockedEventIndex": number;
}
export interface TeambuilderEdge_LogoutV1 {
  "softDisconnect": boolean;
}
export interface TeambuilderEdge_MatchmakingStateV1 {
  "estimatedMatchmakingTimeMillis": number;
  "timeInMatchmakingMillis": number;
  "backwardsTransitionReason"?: string;
}
export interface TeambuilderEdge_MucJwtDto {
  "jwt": string;
  "channelClaim": string;
  "domain": string;
  "targetRegion": string;
}
export interface TeambuilderEdge_PickOrderTradeV1 {
  "id": number;
  "cellId": number;
  "state": string;
}
export interface TeambuilderEdge_PickSkinV2 {
  "skinId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_PickSpellsV1 {
  "spell1Id": number;
  "spell2Id": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_PositionTradeV1 {
  "id": number;
  "cellId": number;
  "state": string;
}
export interface TeambuilderEdge_RerollDataBagForClientV1 {
  "queueId": number;
  "pointsGainedLastGame": number;
  "pointsUntilNextReroll": number;
  "pointCostOfReroll": number;
  "rerollCount": number;
  "maximumRerolls": number;
  "totalPoints": number;
}
export interface TeambuilderEdge_RerollStateV1 {
  "allowRerolling": boolean;
  "rerollsRemaining": number;
}
export interface TeambuilderEdge_SignalChampionPickIntentV1 {
  "championId": number;
  "requestGuid": string;
}
export interface TeambuilderEdge_SimplifiedInventoryWrapperV1 {
  "simplifiedInventoryJwt": string;
}
export interface TeambuilderEdge_TbdGameDtoV1 {
  "counter": number;
  "phaseName": string;
  "queueId": number;
  "gameId"?: number;
  "contextId": string;
  "matchmakingState"?: TeambuilderEdge_MatchmakingStateV1;
  "afkCheckState"?: TeambuilderEdge_AfkCheckStateV1;
  "afkCheckStateV2"?: TeambuilderEdge_AfkCheckStateV2;
  "championSelectState"?: TeambuilderEdge_ChampionSelectStateV1;
  "requestGuid"?: string;
}
export interface TeambuilderEdge_TeambuilderLedgeGameloopResponse {
  "payload"?: TeambuilderEdge_GameloopPlayerInfoV2;
  "status": string;
}
export interface TeambuilderEdge_TeambuilderLedgeResponseV2 {
  "payload"?: TeambuilderEdge_TbdGameDtoV1;
  "status": string;
}
export interface TeambuilderEdge_TradeV1 {
  "id": number;
  "cellId": number;
  "state": string;
}
export interface TeambuilderEdge_UpdateActionV1 {
  "actionId": number;
  "championId": number;
  "completed": boolean;
  "requestGuid": string;
}
export interface TeambuilderEdge_WalletWrapperV1 {
  "signedWalletJwt": string;
  "requestGuid": string;
}
export interface ThemeVp {
  "themeId": number;
  "themeVp": number;
}
export interface TicketOfferDTO {
  "offerPlayerId": number;
  "receivePlayerId": number;
  "count": number;
  "type": TicketType;
  "ticketOfferState": TicketOfferState;
}
export type TicketOfferState = "ACCEPTED" | "ACTIVE" | "REJECTED" | "REVOKED";
export type TicketType = "BASIC" | "PREMIUM";
export interface TierConfig {
  "tier": number;
  "delayTime": number;
  "estimateTime": number;
}
export interface TimeSeriesEventBeginV1 {
  "when": number;
  "eventName": string;
}
export interface TimeSeriesEventEndV1 {
  "when": number;
  "eventName": string;
  "suffix"?: string;
}
export interface TimeSeriesEventMarkerV1 {
  "when": number;
  "eventName": string;
  "markerName": string;
}
export interface TournamentDTO {
  "id": number;
  "scheduleTime": number;
  "scheduleEndTime": number;
  "rosterCreateDeadline": number;
  "entryFee": number;
  "rosterSize": number;
  "themeId": number;
  "nameLocKey": string;
  "nameLocKeySecondary": string;
  "buyInOptions": number[];
  "buyInOptionsPremium": number[];
  "queueId": number;
  "scoutingTimeMs": number;
  "lastThemeOfSeason": boolean;
  "bracketSize": string;
  "minGames": number;
  "smsRestriction": boolean;
  "honorRestriction": boolean;
  "rankRestriction": boolean;
  "voiceEnabled": boolean;
  "phases": TournamentPhaseDTO[];
  "rewardConfig": ClashRewardConfigClient[];
  "tierConfigs": TierConfig[];
  "bracketFormationInitDelayMs": number;
  "bracketFormationIntervalMs": number;
  "status": TournamentStatusEnum;
  "resumeTime": number;
  "lft": boolean;
  "maxInvites": number;
  "maxSuggestionsPerPlayer": number;
}
export interface TournamentHistoryAndWinnersDTO {
  "tournamentHistory": TournamentDTO[];
  "tournamentWinnersCompressed": string;
}
export interface TournamentInfoDTO {
  "tournament": TournamentDTO;
  "roster"?: RosterDTO;
  "pendingRoster"?: PendingRosterDTO;
  "inviteePendingRosters": PendingRosterDTO[];
  "themeVp": number;
}
export interface TournamentInfoMinimalDTO {
  "tournamentInfo": TournamentInfoDTO[];
  "time": number;
}
export interface TournamentPhaseDTO {
  "id": number;
  "tournamentId": number;
  "registrationTime": number;
  "startTime": number;
  "period": number;
  "cancelled": boolean;
  "limitTiers": number[];
  "capacityStatus": CapacityEnum;
}
export interface TournamentPlayerInfoDTO {
  "tournamentInfo": TournamentInfoDTO[];
  "rosterStats": RosterStatsDTO[];
  "player": PlayerDTO;
  "seasonVp": number;
  "themeVps": ThemeVp[];
  "time": number;
  "tier": number;
}
export type TournamentStatusEnum = "CANCELLED" | "DEFAULT" | "PAUSED" | "PRERESUME";
export interface TracingCriticalFlowEventV1 {
  "when": number;
  "eventId": string;
  "succeeded": boolean;
  "payloadString": string;
}
export interface TracingEventV1 {
  "when": number;
  "name": string;
  "src": string;
  "dest": string;
  "tags": string;
  "details": string;
}
export type TracingModuleThreadingModelV1 = "kConcurrent" | "kDedicated" | "kMainThread" | "kNone" | "kParallel" | "kSequential";
export type TracingModuleTypeV1 = "kBackEndPlugin" | "kBackendOther" | "kFrontEndPlugin" | "kRemoteAppModule" | "kRemotingSource" | "kUnknown";
export interface TracingModuleV1 {
  "moduleId": number;
  "name": string;
  "type": TracingModuleTypeV1;
  "threadingModel": TracingModuleThreadingModelV1;
}
export interface TracingPhaseBeginV1 {
  "when": number;
  "name": string;
  "importance": TracingPhaseImportanceV1;
}
export interface TracingPhaseEndV1 {
  "when": number;
  "name": string;
}
export type TracingPhaseImportanceV1 = "major" | "minor" | "trivial";
export interface TutorialMetadata {
  "stepNumber": number;
  "queueId": string;
  "displayRewards": Record<string, string>;
  "useQuickSearchMatchmaking": boolean;
  "useChosenChampion": boolean;
}
export interface VelocityLimiter_VelocityDTO {
  "availableTokens": number;
  "refill": string;
}
export interface VerboseLootOddsDTO {
  "recipeName": string;
  "lastUpdated": string;
  "chanceToContain": LootOddsDTO[];
  "guaranteedToContain": LootOddsDTO[];
  "hasPityRules": boolean;
  "checksOwnership": boolean;
}
export interface YourshopLcdsChampionDTO {
  "championId": number;
  "owned": boolean;
}
export interface YourshopLcdsChampionSkinDTO {
  "championId": number;
  "owned": boolean;
  "skinId": number;
}
export interface YourshopStoreFulfillmentNotification {
  "inventoryType": string;
  "data": unknown;
}
export interface basicOperatingSystemInfo {
  "edition": string;
  "platform": string;
  "versionMajor": string;
  "versionMinor": string;
  "buildNumber": string;
}
export interface basicSystemInfo {
  "operatingSystem": basicOperatingSystemInfo;
  "physicalMemory": number;
  "physicalProcessorCores": number;
}
export interface cookie {
  "url": string;
  "name": string;
  "value": string;
  "domain": string;
  "path": string;
  "secure": boolean;
  "httponly": boolean;
  "expires"?: number;
}
