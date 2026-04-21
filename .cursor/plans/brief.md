# WordPress Shell

---

## **Overview**

WordPress Shell is an exploration into the future of navigation and structure within the WordPress admin experience.

Rather than iterating on the sidebar in isolation, this project reframes navigation as a **system-level concern**—one that shapes how users move, orient themselves, and complete tasks across the entire product.

The goal is to design a cohesive, adaptable shell that supports different user roles, workflows, and mental models. This framing treats WordPress less as a collection of screens and more as a set of connected functional areas or applications.

---

## **Problem Statement**

Despite multiple iterations over the years, the WordPress admin navigation—particularly the sidebar—remains difficult to evolve with confidence.

Key challenges:

* Navigation has been treated as a **component problem**, not a **system problem**
* Workflows vary significantly across user types (e.g. store manager vs. content editor)
* The current structure is **static**, while user needs are dynamic
* Improvements often optimize locally, but fail to improve the **overall experience of getting things done**

This creates friction in a fundamental layer of the product.

---

## **Hypothesis**

We can improve the WordPress admin experience by shifting from a static, hierarchy-first navigation model to a flexible shell built around **role-based entry points, global controls, and faster movement between tasks**.

---

## **Core Concepts**

### 1. **The Shell**

A persistent structural layer that defines:

* Navigation patterns
* Layout regions
* Movement between areas

The shell is composed of a set of persistent layers—such as a global menu (admin bar), entry surfaces (dashboards), and task-focused content areas—that together define how the application is experienced.

This replaces the idea of “the sidebar” as the primary navigation anchor.

---

### 2. **Role-Based Dashboards**

Dashboards act as:

* **Personalised launchpads**
* **Context-aware navigation surfaces**

Example roles:

* Store Manager
* Store Marketer
* Product Manager
* Content Editor

Each role has:

* Relevant metrics
* Common actions
* Shortcuts to key workflows

These surfaces should reflect **user roles, permissions, and responsibilities**, not just personal customisation.

#### **Dashboard Widgets**

Dashboards are composed of a flexible system of widgets, designed around a shared **anatomy and typing model**.

This allows for consistency while supporting a range of use cases.

At a high level, widgets may include:

* **Launch Tiles**
  Simple, action-oriented entry points into key areas (e.g. “Add Product”, “View Orders”)

* **Informational Widgets**
  Surface useful state or content (e.g. “Recently Edited”, “Drafts”)

* **Analytical Widgets**
  Present richer data and insights (e.g. revenue, traffic, performance trends)

* **Navigation Widget (Optional)**
  A compatibility-oriented view of the existing WordPress navigation structure, allowing legacy and third-party destinations to remain accessible while giving users more control over ordering and prominence.

Widgets act as both surfaces for insight and **entry points into deeper workflows**.

The goal is not just flexibility, but **coherence**—ensuring all widgets feel like part of the same system, regardless of complexity.

---

### 3. **Navigation as Flow**

Instead of static menus, navigation should support:

* **Progressive disclosure**
* **Task-oriented movement**
* **Contextual shortcuts**

Navigation emerges from a combination of structured entry points (e.g. dashboards), global controls (admin bar), and contextual pathways within tasks.

#### **Context Switching**

In addition to destination-based navigation, the system supports fast, ergonomic switching between active contexts—similar to application switching patterns in modern operating systems.

This enables users to move fluidly between ongoing tasks such as content management, editing, and settings without relying on hierarchical navigation.

The goal is to support **continuous workflows**, where users can quickly return to recent or active areas, rather than repeatedly navigating from a fixed starting point.

This introduces a model where users navigate between **active contexts**, not just static locations.

---

### 4. **Composable Structure**

The system should allow:

* Flexible layouts
* Extensible navigation patterns
* Consistency across plugins and features

The system should support progressive adoption, allowing existing plugins and interfaces to integrate without requiring full redesign upfront.

Extensibility should apply not only to navigation patterns and content surfaces, but also to global system actions.

---

### 5. **Elevated Admin Bar**

The admin bar evolves into a **system-level menu**, providing a consistent, context-aware layer for global actions and navigation.

It acts as the always-available control layer for cross-cutting capabilities that are not owned by any single workflow or screen.

This layer provides access to key global capabilities, including:

* **Command access** (e.g. command palette for quick navigation and actions)
* **Notifications** (system updates, activity, alerts)
* **Creation flows** (e.g. add page, add product, create content)
* **AI assistance** (context-aware help, content generation, and task support)

The admin bar should also support **extensible actions and shortcuts from third parties**, allowing plugins and integrations to contribute useful global capabilities alongside core actions.

To preserve clarity and user control, actions introduced by third parties should be **user-manageable**, with end users able to toggle their visibility according to relevance and preference.

---

## **Forward-Looking Extensions**

As a future extension, the system may explore enabling users to generate custom widgets or dashboard views using AI.

This could allow users to describe a goal or theme—such as “store performance”, “content pipeline”, or “launch campaign”—and have the system assemble a contextual workspace using existing widget types, data, and actions.

This is not core to the initial concept, but points toward a longer-term direction where users can shape their own working environment through structured, agent-assisted composition.

---

## **Success Metric**

### **Primary Metric: Time-to-Destination**

Measure how quickly users can complete common workflows from entry.

Examples:

* Add a new product
* Update pricing
* Launch a campaign
* Edit a page

This will be evaluated through defined task scenarios, measuring time, steps, and interaction patterns from entry to completion.

This can be tested by:

* Comparing baseline vs. prototype flows
* Measuring clicks, time, and friction points

### **Supporting Signals**

* Reduced navigation steps
* Increased use of dashboard shortcuts
* Reduced effort to return to active or recent workflows
* Improved user confidence (qualitative)

---

## **Prototype Strategy**

To validate the concept:

* Create **role-based dashboard recipes**
* Model realistic workflows (eCommerce is a strong test case)
* Compare:

  * Current admin flow
  * Shell-based flow

Each prototype scenario should define:

* A user role
* A starting context
* A target task
* A comparison against the current experience

Focus on:

* Entry → action → completion loops

---

## **Design Principles**

* **System-first thinking** over component-first
* **Task-oriented navigation** over structural hierarchy
* **Adaptability** over static layouts
* **Clarity and speed** over completeness

---

## **What This Is Not**

* Not a redesign of the sidebar alone
* Not a purely visual refresh
* Not a fixed navigation structure
* Not a one-size-fits-all interface

---

## **What Success Looks Like**

* Users reach their goal faster, with less friction
* Navigation feels **predictable but flexible**
* The system scales across roles and use cases
* The system remains coherent even as third parties extend it
* WordPress feels more like a **cohesive application**, not a collection of screens
