import { Args, Query, Resolver } from '@nestjs/graphql';
import { CreatePromotionResult, QueryProductsArgs } from '@vendure/common/lib/generated-types';
import { PaginatedList } from '@vendure/common/lib/shared-types';

import { ErrorResultUnion, Translated } from '../../../common';
import { PromotionItemAction, PromotionOrderAction } from '../../../config/promotion/promotion-action';
import { PromotionCondition } from '../../../config/promotion/promotion-condition';
import { Promotion } from '../../../entity/promotion/promotion.entity';
import { ProductService, PromotionService } from '../../../service';
import { ConfigurableOperationCodec } from '../../common/configurable-operation-codec';
import { RequestContext } from '../../common/request-context';
import { RelationPaths, Relations } from '../../decorators/relations.decorator';
import { Ctx } from '../../decorators/request-context.decorator';

@Resolver()
export class ShopPromotionResolver {
    constructor(
        private promotionService: PromotionService,
        private productService: ProductService,
        private configurableOperationCodec: ConfigurableOperationCodec,
    ) {}

    @Query()
    async promotions(
        @Ctx() ctx: RequestContext,
        @Args() args: QueryProductsArgs,
        @Relations(Promotion) relations: RelationPaths<Promotion>,
    ): Promise<PaginatedList<Promotion>> {
        return this.promotionService.findAll(ctx, args.options || undefined, relations).then(res => {
            res.items.forEach(this.encodeConditionsAndActions);
            return res;
        });
    }

    /**
     * Encodes any entity IDs used in the filter arguments.
     */
    private encodeConditionsAndActions = <
        T extends ErrorResultUnion<CreatePromotionResult, Promotion> | undefined,
    >(
        maybePromotion: T,
    ): T => {
        if (maybePromotion instanceof Promotion) {
            this.configurableOperationCodec.encodeConfigurableOperationIds(
                PromotionOrderAction,
                maybePromotion.actions,
            );
            this.configurableOperationCodec.encodeConfigurableOperationIds(
                PromotionCondition,
                maybePromotion.conditions,
            );
        }
        return maybePromotion;
    };
}
