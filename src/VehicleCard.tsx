import React from "react";
import {
  Button,
  ButtonGroup,
  Card,
  Tabs,
  Tab,
  Tag,
  HTMLTable,
  Icon,
  Menu,
  Popover,
  Position
} from "@blueprintjs/core";
import {
  ActiveVehicle,
  calculateTotalCost,
  calculateTotalHull
} from "./rules/vehicles";
import styles from "./VehicleCard.module.css";
import {
  ActiveWeapon,
  getNextFacing,
  WeaponFacing,
  weaponTypes
} from "./rules/weapons";
import { assertNever } from "assert-never";
import {
  ActiveVehicleUpgrade,
  VehicleUpgrade,
  vehicleUpgrades
} from "./rules/vehicleUpgrades";

interface VehicleCardProps {
  vehicle: ActiveVehicle;
  onUpdate: (vehicle: ActiveVehicle) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function buildTabTitle(title: string, items: Array<Object>): string {
  if (!items || items.length === 0) {
    return title;
  }

  return `${title} (${items.length})`;
}

function buildArcOfFireIcon(facing: WeaponFacing): React.ReactNode {
  switch (facing) {
    case "front":
      return <Icon icon="arrow-up" title="front" />;
    case "rear":
      return <Icon icon="arrow-down" title="rear" />;
    case "side":
      return <Icon icon="arrows-horizontal" title="sides" />;
    case "turret":
      return <Icon icon="circle" title="360°" />;
    default:
      assertNever(facing);
  }
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onUpdate,
  onDuplicate,
  onRemove
}): React.ReactElement => {
  return (
    <Card>
      <h2>
        {vehicle.type.name} ({calculateTotalCost(vehicle)} cans)
      </h2>
      {[
        {
          value: vehicle.type.weight
        },
        {
          label: "Hull",
          value: calculateTotalHull(vehicle)
        },
        {
          label: "Handling",
          value: vehicle.type.handling
        },
        {
          label: "Max. Gear",
          value: vehicle.type.maxGear
        },
        {
          label: "Crew",
          value: vehicle.type.crew
        },
        {
          label: "Build Slots",
          value: vehicle.type.buildSlots
        },
        {
          label: "Cost",
          value: vehicle.type.cost
        }
      ].map(({ label, value }) => (
        <div className={styles.propertyTag} key={(label || "") + value}>
          <Tag>{label ? `${label}: ${value}` : value}</Tag>
        </div>
      ))}

      {vehicle.type.specialRule && (
        <div className={styles.specialRule}>{vehicle.type.specialRule}</div>
      )}

      <div className={styles.kitContainer}>
        <Tabs>
          <Tab
            id="weapons"
            title={buildTabTitle("Weapons", vehicle.weapons)}
            panel={
              <>
                <HTMLTable>
                  <thead>
                    <tr>
                      <td>
                        <Icon title="Weapon" icon="ninja" />
                      </td>
                      <td>
                        <Icon title="Arc of fire" icon="locate" />
                      </td>
                      <td>
                        <Icon title="Range" icon="arrows-horizontal" />
                      </td>
                      <td>
                        <Icon title="Attack Dice" icon="cube" />
                      </td>
                      <td>
                        <Icon title="Build Slots" icon="cog" />
                      </td>
                      <td>
                        <Icon title="Cost" icon="dollar" />
                      </td>
                      <td>&nbsp;</td>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicle.weapons.map(
                      ({ type, facing }: ActiveWeapon, index: number) => (
                        <tr key={type.abbreviation + index}>
                          <td>{type.name}</td>
                          <td>
                            {facing === "turret" ? (
                              buildArcOfFireIcon(facing)
                            ) : (
                              <div
                                className={styles.actionIcon}
                                onClick={() => {
                                  onUpdate({
                                    ...vehicle,
                                    weapons: vehicle.weapons.map((w, i) => {
                                      if (i !== index) {
                                        return w;
                                      }
                                      return {
                                        type: w.type,
                                        facing: getNextFacing(w.facing)
                                      };
                                    })
                                  });
                                }}
                              >
                                {buildArcOfFireIcon(facing)}
                              </div>
                            )}
                          </td>
                          <td title="Range">{type.range}</td>
                          <td title="Attack Dice">{type.attackDice}D6</td>
                          <td title="Build Slots">{type.buildSlots}</td>
                          <td title="Cost">{type.cost}</td>
                          <td>
                            {!type.isDefault && (
                              <Icon
                                className={styles.actionIcon}
                                icon="delete"
                                onClick={() => {
                                  onUpdate({
                                    ...vehicle,
                                    weapons: vehicle.weapons.filter(
                                      (v, i) => i !== index
                                    )
                                  });
                                }}
                              />
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </HTMLTable>
                <Popover
                  content={
                    <Menu>
                      {weaponTypes
                        .filter(weapon => !weapon.isDefault)
                        .map(weapon => (
                          <Menu.Item
                            key={weapon.name}
                            text={weapon.name}
                            onClick={() =>
                              onUpdate({
                                ...vehicle,
                                weapons: [
                                  ...vehicle.weapons,
                                  { type: weapon, facing: "front" }
                                ]
                              })
                            }
                          ></Menu.Item>
                        ))}
                    </Menu>
                  }
                  position={Position.BOTTOM}
                  minimal
                >
                  <Button icon="add">Add Weapon</Button>
                </Popover>
              </>
            }
          ></Tab>
          <Tab
            id="upgrade"
            title={buildTabTitle("Upgrades", vehicle.upgrades)}
            panel={
              <>
                <HTMLTable>
                  <thead>
                    <tr>
                      <td>
                        <Icon title="Upgrade" icon="asterisk" />
                      </td>
                      <td>&nbsp;</td>
                      <td>
                        <Icon title="Build Slots" icon="cog" />
                      </td>
                      <td>
                        <Icon title="Cost" icon="dollar" />
                      </td>
                      <td>&nbsp;</td>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicle.upgrades.map(({ type, amount }, index: number) => (
                      <tr key={type.abbreviation + index}>
                        <td>
                          {type.name + (amount > 1 ? ` (${amount}×)` : "")}
                        </td>
                        <td>{type.description}</td>
                        <td title="Build Slots">{type.buildSlots}</td>
                        <td title="Cost">{type.cost}</td>
                        <td className={styles.tableCellControls}>
                          {type.canBeUsedMultipleTimes ? (
                            <>
                              <Icon
                                className={styles.actionIcon}
                                icon="add"
                                title="Add"
                                onClick={() => {
                                  onUpdate({
                                    ...vehicle,
                                    upgrades: vehicle.upgrades.map(u =>
                                      u.type === type
                                        ? {
                                            type,
                                            amount: u.amount + 1
                                          }
                                        : u
                                    )
                                  });
                                }}
                              />
                              <span>&nbsp;</span>
                              <Icon
                                className={styles.actionIcon}
                                icon="remove"
                                title="Remove"
                                onClick={() => {
                                  onUpdate({
                                    ...vehicle,
                                    upgrades:
                                      amount > 1
                                        ? vehicle.upgrades.map(u =>
                                            u.type === type
                                              ? {
                                                  type,
                                                  amount: u.amount - 1
                                                }
                                              : u
                                          )
                                        : vehicle.upgrades.filter(
                                            (v, i) => i !== index
                                          )
                                  });
                                }}
                              />
                            </>
                          ) : (
                            <Icon
                              className={styles.actionIcon}
                              icon="delete"
                              title="Delete"
                              onClick={() => {
                                onUpdate({
                                  ...vehicle,
                                  upgrades: vehicle.upgrades.filter(
                                    (v, i) => i !== index
                                  )
                                });
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </HTMLTable>
                <Popover
                  content={
                    <Menu>
                      {vehicleUpgrades.map(upgrade => (
                        <Menu.Item
                          key={upgrade.name}
                          text={upgrade.name}
                          onClick={() => {
                            const currentUpgrade = vehicle.upgrades.find(
                              u => u.type === upgrade
                            );
                            const upgrades: ActiveVehicleUpgrade[] = currentUpgrade
                              ? vehicle.upgrades.map(({ type, amount }) =>
                                  type === upgrade
                                    ? { type, amount: amount + 1 }
                                    : { type, amount }
                                )
                              : [
                                  ...vehicle.upgrades,
                                  { type: upgrade, amount: 1 }
                                ];
                            onUpdate({
                              ...vehicle,
                              upgrades
                            });
                          }}
                        ></Menu.Item>
                      ))}
                    </Menu>
                  }
                  position={Position.BOTTOM}
                  minimal
                >
                  <Button icon="add">Add Upgrade</Button>
                </Popover>
              </>
            }
          ></Tab>
          <Tab
            id="perks"
            title="Perks"
            panel={
              <>
                <Button icon="add">Add Perk</Button>
              </>
            }
          ></Tab>
        </Tabs>
      </div>

      <ButtonGroup>
        <Button icon="remove" onClick={onRemove}>
          Remove
        </Button>
        <Button icon="duplicate" onClick={onDuplicate}>
          Duplicate
        </Button>
      </ButtonGroup>
    </Card>
  );
};

export default VehicleCard;
