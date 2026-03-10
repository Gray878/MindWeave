// Wire provider set for Neo4j
package neo4j

import "github.com/google/wire"

var ProviderSet = wire.NewSet(
	ProvideNeo4jStore,
)
